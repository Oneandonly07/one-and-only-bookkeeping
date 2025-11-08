import MembersTable from "./MembersTable";

type Props = {
  params: { teamId: string };
};

export default function TeamMembersPage({ params }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Test banner */}
      <div className="mb-4 rounded-2xl bg-violet-600 p-3 text-white">
        <div className="text-sm font-semibold">
          ✅ Shadcn Members Page — Team ID: {params.teamId}
        </div>
        <div className="text-xs text-white/80">
          If you see this violet banner, the new page is working.
        </div>
      </div>

      <MembersTable teamId={params.teamId} />
    </div>
  );
}
