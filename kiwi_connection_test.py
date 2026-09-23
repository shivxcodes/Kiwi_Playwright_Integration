import ssl
from getpass import getpass
from tcms_api import TCMS
from tcms_api.xmlrpc import SafeCookieTransport

username = "shivxcodes"
password = getpass("Enter Kiwi TCMS password: ")

# Accept the self-signed certificate used by local Kiwi TCMS
TCMS.transport = SafeCookieTransport(
    context=ssl._create_unverified_context()
)

kiwi = TCMS(
    "https://localhost/xml-rpc/",
    username,
    password
)

print("Kiwi TCMS connection successful!")