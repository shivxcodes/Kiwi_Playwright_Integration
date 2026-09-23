import os
import sys
import ssl

from tcms_api import TCMS
from tcms_api.xmlrpc import TCMSXmlrpc, SafeCookieTransport


# Read Kiwi settings from environment variables
KIWI_URL = os.environ["KIWI_URL"]
KIWI_USERNAME = os.environ["KIWI_USERNAME"]
KIWI_PASSWORD = os.environ["KIWI_PASSWORD"]
# Read the current Run ID from the file created by kiwi_create_run.py
# instead of a fixed environment variable, so every test session
# updates the correct (latest) Test Run automatically.
with open(".kiwi_run_id", "r") as f:
    KIWI_RUN_ID = int(f.read().strip())


# Kiwi is running locally with a self-signed HTTPS certificate.
# This allows our local script to connect to it.
TCMSXmlrpc.transport = SafeCookieTransport(
    context=ssl._create_unverified_context()
)


def update_kiwi(case_id, status_id):
    # Connect to Kiwi TCMS
    kiwi = TCMS(
        KIWI_URL,
        KIWI_USERNAME,
        KIWI_PASSWORD
    )

    # Find the test execution for this case inside our Test Run
    executions = kiwi.exec.TestExecution.filter({
        "run": KIWI_RUN_ID,
        "case": case_id
    })

    # If the case is not already added to the Test Run,
    # add it automatically.
    if not executions:
        print(f"Case TC-{case_id} is not in Test Run {KIWI_RUN_ID}. Adding it...")

        created = kiwi.exec.TestRun.add_case(
            KIWI_RUN_ID,
            case_id
        )

        execution_id = created[0]["id"]

    else:
        execution_id = executions[0]["id"]

    # Update the execution status
    result = kiwi.exec.TestExecution.update(
        execution_id,
        {
            "status": status_id
        }
    )

    print(
        f"Kiwi updated: TC-{case_id} -> "
        f"{result['status__name']} "
        f"(Execution ID: {execution_id})"
    )


if __name__ == "__main__":

    if len(sys.argv) != 3:
        print("Usage: py kiwi_update.py <case_id> <status_id>")
        sys.exit(1)

    case_id = int(sys.argv[1])
    status_id = int(sys.argv[2])

    update_kiwi(case_id, status_id)