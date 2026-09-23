import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import { spawnSync } from 'child_process';

class KiwiReporter implements Reporter {

  onBegin(config: FullConfig, suite: any) {
    console.log('Kiwi Reporter: Creating new Test Run...');

    const create = spawnSync(
      'py',
      ['kiwi_create_run.py'],
      {
        stdio: 'inherit',
        shell: true,
        env: process.env,
      }
    );

    if (create.error) {
      console.error(
        'Kiwi Reporter: Failed to run kiwi_create_run.py',
        create.error
      );
    }

    if (create.status !== 0) {
      console.error(
        'Kiwi Reporter: Could not create new Kiwi Test Run. Tests will still run, but results will NOT be sent to Kiwi correctly.'
      );
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {

    // Read the Kiwi Test Case ID from the test title.
    // Example:
    // "TC-1 - Verify user can login"
    // becomes:
    // "1"
    const match = test.title.match(/^TC-(\d+)/);

    // If the test doesn't contain a Kiwi ID,
    // we cannot know which Kiwi case to update.
    if (!match) {
      console.log(
        `Kiwi Reporter: No Kiwi case ID found in "${test.title}"`
      );
      return;
    }

    const caseId = match[1];

    // Convert Playwright result into Kiwi status ID.
    let statusId: string;

    if (result.status === 'passed') {
      statusId = '4';
    } else if (
      result.status === 'failed' ||
      result.status === 'timedOut' ||
      result.status === 'interrupted'
    ) {
      statusId = '5';
    } else if (result.status === 'skipped') {
      statusId = '8';
    } else {
      console.log(
        `Kiwi Reporter: Unknown result "${result.status}" for TC-${caseId}`
      );
      return;
    }

    console.log(
      `Kiwi Reporter: TC-${caseId} -> ${result.status}`
    );

    // Run the Python Kiwi updater.
    const update = spawnSync(
      'py',
      [
        'kiwi_update.py',
        caseId,
        statusId,
      ],
      {
        stdio: 'inherit',
        shell: true,
        env: process.env,
      }
    );

    if (update.error) {
      console.error(
        'Kiwi Reporter: Failed to run kiwi_update.py',
        update.error
      );
    }

    if (update.status !== 0) {
      console.error(
        `Kiwi Reporter: Kiwi update failed for TC-${caseId}`
      );
    }
  }

  onEnd(result: FullResult) {
    console.log(
      `Kiwi Reporter: Test run finished with status "${result.status}"`
    );
  }
}

export default KiwiReporter;