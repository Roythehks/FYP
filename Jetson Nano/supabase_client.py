"""Supabase helper functions for retrieving user permission data."""

# supabase_client.py
import json
from typing import Dict, Any
from supabase import create_client, Client

SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZGtueHlkd2JvdHNjcHhzcWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM5ODEsImV4cCI6MjA3NzU4OTk4MX0"
    ".z3MBkThcv3vSgMOuHK_g3HnzUdyXhm71ArrwGAQEU7A"
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def fetch_users_permissions() -> Dict[str, Dict[str, bool]]:
    """Return: {"gordon": {"fan": false, "light": true, "door": false}, ...}"""
    try:
        # 1. users
        users_resp = supabase.table("users").select("id, name").execute()
        users = users_resp.data or []

        # 2. permissions
        perms_resp = supabase.table("permissions").select("id, name").order("name").execute()
        all_perms = perms_resp.data or []

        result = {}
        for user in users:
            user_id = user["id"]
            user_name = user["name"].lower()

            # 3. 取呢個 user 嘅權限
            user_perms_resp = (
                supabase.table("user_permissions")
                .select("permission_id, granted")
                .eq("user_id", user_id)
                .execute()
            )
            granted_map = {row["permission_id"]: row["granted"] for row in (user_perms_resp.data or [])}

            # 4. {"fan": false, "light": true, "door": false}
            perms_dict = {perm["name"]: granted_map.get(perm["id"], False) for perm in all_perms}
            result[user_name] = perms_dict

        return result
    except Exception as e:
        print(f"DB Error: {e}")
        return {}


