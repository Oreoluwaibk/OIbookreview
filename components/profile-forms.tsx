"use client";

import { useActionState } from "react";
import { removeAvatar, updateAvatar, updateProfile, type ProfileState } from "@/app/actions/profile";

const initialState: ProfileState = {};

const fieldClass = "w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink";

export function ProfileDetailsForm({
  displayName,
  email,
  memberSince,
  bio,
}: {
  displayName: string;
  email: string;
  memberSince: string;
  bio: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm font-semibold">
        Name
        <input name="displayName" defaultValue={displayName} autoComplete="name" required className={fieldClass} />
      </label>
      <div className="grid gap-1 text-sm">
        <span className="font-semibold">Email</span>
        <p className="rounded-xl border border-line bg-paper px-3 py-2 text-ink-soft">{email}</p>
      </div>
      <div className="grid gap-1 text-sm">
        <span className="font-semibold">Registered</span>
        <p className="text-ink-soft">{memberSince}</p>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        A short note
        <textarea
          name="bio"
          defaultValue={bio}
          maxLength={280}
          rows={3}
          placeholder="What you are reading toward"
          className={fieldClass}
        />
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-deep disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function AvatarForm({ hasPicture }: { hasPicture: boolean }) {
  const [state, action, pending] = useActionState(updateAvatar, initialState);
  const [removed, remove, removing] = useActionState(removeAvatar, initialState);

  return (
    <div className="grid gap-3">
      <form action={action} className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">
          Picture
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-lake-soft file:px-3 file:py-2 file:font-semibold file:text-lake-deep"
          />
        </label>
        <p className="text-sm text-ink-soft">JPEG, PNG, WebP, or GIF, under 1 MB.</p>
        {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-lake-deep">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save picture"}
        </button>
      </form>
      {hasPicture ? (
        <form action={remove}>
          {removed.error ? <p className="mb-2 text-sm text-clay">{removed.error}</p> : null}
          {removed.message ? <p className="mb-2 text-sm text-lake-deep">{removed.message}</p> : null}
          <button type="submit" disabled={removing} className="text-sm font-semibold text-lake-deep disabled:opacity-60">
            {removing ? "Removing…" : "Remove picture"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
