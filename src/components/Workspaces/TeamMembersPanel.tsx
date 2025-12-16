import { useState, useEffect } from "react";
import { useWorkspaceStore, TeamMember } from "../../stores/workspaceStore";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";

interface TeamMembersPanelProps {
  workspaceId: string;
}

export default function TeamMembersPanel({ workspaceId }: TeamMembersPanelProps) {
  const { workspaces, teamMembers, setTeamMembers, removeMember } = useWorkspaceStore();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const workspace = workspaces.find((w) => w.id.toString() === workspaceId);
  const members = workspace?.team_members || teamMembers;

  useEffect(() => {
    loadTeamMembers();
  }, [workspaceId]);

  const loadTeamMembers = async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const workspace = await response.json();
        if (workspace.team_members) {
          setTeamMembers(workspace.team_members);
        }
      }
    } catch (error) {
      console.error("Failed to load team members:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa member này?")) return;

    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await removeMember(workspaceId, userId);
        await loadTeamMembers();
        toast.success("Member removed successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove member");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "member":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
        Team Members
      </h4>
      {members.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No members yet. Invite members to collaborate.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  {member.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.user?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(member.role)}`}
                >
                  {member.role}
                </span>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={loading}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




