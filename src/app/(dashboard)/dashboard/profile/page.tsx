import { redirect } from "next/navigation";
import { getSession } from "~/server/auth/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details and account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{session.user.name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-900 text-xs">{session.user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(session.user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {session.user.emailVerified ? (
                  <span className="text-green-600">Verified</span>
                ) : (
                  <span className="text-yellow-600">Not verified</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Change your display name and other settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Profile editing functionality coming soon. You&apos;ll be able to update your name, avatar, and other preferences here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Password management and security settings coming soon. You&apos;ll be able to change your password and enable two-factor authentication here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}