import os
import sys
import ssl
import datetime

from tcms_api import TCMS
from tcms_api.xmlrpc import TCMSXmlrpc, SafeCookieTransport


# Read Kiwi settings from environment variables
KIWI_URL = os.environ["KIWI_URL"]
KIWI_USERNAME = os.environ["KIWI_USERNAME"]
KIWI_PASSWORD = os.environ["KIWI_PASSWORD"]

# We now use PLAN_ID instead of a fixed RUN_ID,
# because every session creates its own new Run
# under this same Test Plan.
KIWI_PLAN_ID = int(os.environ["KIWI_PLAN_ID"])


TCMSXmlrpc.transport = SafeCookieTransport(
    context=ssl._create_unverified_context()
)


def create_run():
    kiwi = TCMS(
        KIWI_URL,
        KIWI_USERNAME,
        KIWI_PASSWORD
    )

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    summary = f"Automated Playwright Run - {timestamp}"

    # Fetch the plan to reuse its product/build info automatically
        # Fetch the plan to reuse its product/version info automatically
    plan = kiwi.exec.TestPlan.filter({"id": KIWI_PLAN_ID})[0]

    # Find the Build to attach (e.g. "1.0.0") under this plan's product version
    builds = kiwi.exec.Build.filter({
        "version": plan["product_version"]
    })

    if not builds:
        raise Exception(
            f"No Build found for product_version {plan['product_version']}. "
            f"Create one in Kiwi first (Admin > Builds)."
        )

    # Use the first available build (or you can filter by name="1.0.0" if you have multiple)
    build_id = builds[0]["id"]

    new_run = kiwi.exec.TestRun.create({
        "plan": KIWI_PLAN_ID,
        "summary": summary,
        "manager": plan["author"],
        "product_version": plan["product_version"],
        "build": build_id,
    })

    run_id = new_run["id"]

    # Save the new run ID so other scripts (kiwi_update.py) can read it
    with open(".kiwi_run_id", "w") as f:
        f.write(str(run_id))

    print(f"Kiwi: Created new Test Run TR-{run_id} -> \"{summary}\"")


if __name__ == "__main__":
    create_run()