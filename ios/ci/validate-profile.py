"""Validate decoded signing metadata without logging the profile or its identities."""
import datetime
import plistlib
import sys


def validate(profile, team, bundle, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    entitlements = profile.get("Entitlements", {})
    expiry = profile.get("ExpirationDate")
    if not isinstance(expiry, datetime.datetime) or expiry.replace(tzinfo=datetime.timezone.utc) <= now:
        raise ValueError("Das Provisioning-Profil fehlt oder ist abgelaufen.")
    if profile.get("TeamIdentifier") != [team] or entitlements.get("com.apple.developer.team-identifier") != team:
        raise ValueError("Das Provisioning-Profil gehört nicht zum konfigurierten Apple-Team.")
    if entitlements.get("application-identifier") != team + "." + bundle:
        raise ValueError("Das Provisioning-Profil passt nicht zur Bundle-ID.")
    if entitlements.get("com.apple.developer.healthkit") is not True:
        raise ValueError("Im Profil fehlt die HealthKit-Berechtigung.")
    if entitlements.get("get-task-allow") or profile.get("ProvisionedDevices") or profile.get("ProvisionsAllDevices"):
        raise ValueError("Ein App-Store-Connect-Verteilungsprofil wird benötigt.")
    if not profile.get("DeveloperCertificates") or not profile.get("UUID") or not profile.get("Name"):
        raise ValueError("Das Provisioning-Profil ist unvollständig.")
    return profile["UUID"], profile["Name"]


if __name__ == "__main__":
    with open(sys.argv[1], "rb") as source:
        profile = plistlib.load(source)
    try:
        validate(profile, sys.argv[2], sys.argv[3])
    except ValueError as error:
        sys.exit(str(error))
    print("App-Store-Profil, Team, Bundle-ID, HealthKit und Ablaufdatum geprüft.")
