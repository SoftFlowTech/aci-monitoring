from typing import Optional, List
from urllib.parse import quote

import requests
from acitoolkit import Session  # type: ignore

aci_session: Optional[Session] = None


def get_aci_session(config: dict) -> Session:
    global aci_session
    if aci_session is None:
        aci_session = Session(config["url"], config["username"], config["password"])
        aci_session.login(timeout=2)
    return aci_session


def aci_get(session: Session, url: str):
    return session.get(url, timeout=5)


def aci_query(session: Session, class_name: str, query: str) -> List[dict]:
    # Build URL
    query_target_part = f"query-target-filter={quote(query)}&" if query else ""
    url = f"/api/node/class/{quote(class_name)}.json?{query_target_part}rsp-subtree-include=health"  # noqa

    # Call APIC
    response: requests.Response = aci_get(session, url)

    # Raise exception when there was some problem
    if response.status_code != 200:
        raise Exception(f'error while querying "{class_name}": {response.text}')

    # Return data otherwise
    return response.json()["imdata"]
