import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

// TestRail status IDs
const PASSED = 1;
const RETEST = 4;
const FAILED = 5;

interface CaseResult {
  case_id: number;
  status_id: number;
  comment: string;
  elapsed?: string;
}

class TestRailReporter implements Reporter {
  private results = new Map<number, CaseResult>();

  private readonly baseUrl = (process.env.TESTRAIL_URL || '').replace(/\/$/, '');
  private readonly email = process.env.TESTRAIL_EMAIL || '';
  private readonly apiKey = process.env.TESTRAIL_API_KEY || '';
  private readonly projectId = process.env.TESTRAIL_PROJECT_ID || '';

  private get enabled(): boolean {
    return !!(this.baseUrl && this.email && this.apiKey && this.projectId);
  }

  onBegin(): void {
    if (!this.enabled) {
      console.warn('[TestRail] Missing env vars (TESTRAIL_URL/EMAIL/API_KEY/PROJECT_ID). Reporter disabled.');
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Map "TC-<number>" in the title to TestRail case C<number>
    const match = test.title.match(/TC-(\d+)/i);
    if (!match) return;
    const caseId = Number(match[1]);

    let status = RETEST; // skipped / interrupted
    if (result.status === 'passed') status = PASSED;
    else if (result.status === 'failed' || result.status === 'timedOut') status = FAILED;

    const comment =
      status === PASSED
        ? 'Passed via Playwright automation'
        : `Playwright status: ${result.status}\n${result.error?.message ?? ''}`.slice(0, 2000);

    // Later attempts (retries) overwrite earlier ones, so the final result wins
    this.results.set(caseId, {
      case_id: caseId,
      status_id: status,
      comment,
      elapsed: `${Math.max(1, Math.round(result.duration / 1000))}s`,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (!this.enabled || this.results.size === 0) return;

    try {
      const caseIds = [...this.results.keys()];
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const run = await this.api('POST', `add_run/${this.projectId}`, {
        name: `Playwright Automated Run - ${stamp}`,
        description: process.env.CI ? 'Triggered from GitHub Actions' : 'Triggered locally',
        include_all: false,
        case_ids: caseIds,
      });

      await this.api('POST', `add_results_for_cases/${run.id}`, {
        results: [...this.results.values()],
      });

      console.log(`[TestRail] Run #${run.id} created with ${caseIds.length} result(s): ${this.baseUrl}/index.php?/runs/view/${run.id}`);
    } catch (err) {
      // Never fail the test run because of a reporting problem
      console.error('[TestRail] Failed to report results:', err);
    }
  }

  private async api(method: string, endpoint: string, body?: unknown): Promise<any> {
    const auth = Buffer.from(`${this.email}:${this.apiKey}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/index.php?/api/v2/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`TestRail API ${endpoint} -> ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
}

export default TestRailReporter;