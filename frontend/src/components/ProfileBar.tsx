import { useEffect, useState } from "react";
import type { Bootstrap } from "../types";
import * as api from "../api";
import { ComboInput } from "./ComboInput";

interface ProfileBarProps {
  data: Bootstrap;
  onChange: (data: Bootstrap) => void;
  onManage: () => void;
}

export function ProfileBar({ data, onChange, onManage }: ProfileBarProps) {
  const [profile, setProfile] = useState(data.active_profile);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(data.active_profile);
  }, [data.active_profile]);

  const applyProfile = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setProfile(data.active_profile);
      return;
    }
    if (trimmed === data.active_profile) {
      setProfile(data.active_profile);
      return;
    }
    setSwitching(true);
    setError("");
    try {
      const next = await api.switchProfile(trimmed);
      setProfile(next.active_profile);
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch profile.");
      setProfile(data.active_profile);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <section className="card profile-bar">
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid profile-grid">
        <ComboInput
          label="Profile"
          value={profile}
          options={data.dropdown_profiles}
          onChange={setProfile}
          onBlur={applyProfile}
          placeholder="Default"
          disabled={switching}
        />
        <div className="field profile-actions">
          <span className="field-label-spacer" aria-hidden="true" />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onManage}
            disabled={switching}
          >
            Manage profiles
          </button>
        </div>
      </div>
    </section>
  );
}
