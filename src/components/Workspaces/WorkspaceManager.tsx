import { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { syncService } from "../../services/syncService";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Textarea from "../UI/Textarea";
import Select from "../UI/Select";
import Modal from "../UI/Modal";
import Card from "../UI/Card";
import Badge from "../UI/Badge";
import TeamMembersPanel from "./TeamMembersPanel";
import InviteMemberModal from "./InviteMemberModal";
import { Plus, Users, User, Trash2, FolderOpen } from "lucide-react";

export default function WorkspaceManager() {
  const {
    workspaces,
    activeWorkspace,
    setWorkspaces,
    setActiveWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
        // Set first workspace as active if none selected
        if (!activeWorkspace && data.length > 0) {
          setActiveWorkspace(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error("Vui lòng nhập tên workspace");
      return;
    }

    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để tạo workspace");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newWorkspaceName,
            description: newWorkspaceDesc,
            is_team: isTeam,
          }),
        }
      );

      if (response.ok) {
        const workspace = await response.json();
        addWorkspace(workspace);
        setActiveWorkspace(workspace.id.toString());
        setShowCreateModal(false);
        setNewWorkspaceName("");
        setNewWorkspaceDesc("");
        setIsTeam(false);
        toast.success("Workspace created successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create workspace");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa workspace này?")) return;

    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        deleteWorkspace(id);
        toast.success("Workspace deleted successfully");
      } else {
        toast.error("Failed to delete workspace");
      }
    } catch (error) {
      toast.error("Failed to delete workspace");
    }
  };

  const currentWorkspace = workspaces.find((w) => w.id.toString() === activeWorkspace);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workspaces
          </h3>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Workspace
        </Button>
      </div>

      <Select
        fullWidth
        label="Active Workspace"
        value={activeWorkspace || ""}
        onChange={(e) => setActiveWorkspace(e.target.value || null)}
        options={[
          { value: "", label: "Select Workspace" },
          ...workspaces.map((workspace) => ({
            value: workspace.id.toString(),
            label: `${workspace.name} ${workspace.is_team ? "(Team)" : "(Personal)"}`,
          })),
        ]}
      />

      {currentWorkspace && (
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                {currentWorkspace.is_team ? (
                  <Users size={18} className="text-blue-600 dark:text-blue-400" />
                ) : (
                  <User size={18} className="text-gray-600 dark:text-gray-400" />
                )}
                <span>{currentWorkspace.name}</span>
                {currentWorkspace.is_team && (
                  <Badge variant="primary" size="sm">
                    Team
                  </Badge>
                )}
              </div>
            }
            subtitle={currentWorkspace.description}
            footer={
              <div className="flex items-center justify-between">
                {currentWorkspace.is_team && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1.5"
                  >
                    <Users size={14} />
                    Invite Members
                  </Button>
                )}
                {currentWorkspace.owner_id === localStorage.getItem("user_id") && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteWorkspace(currentWorkspace.id.toString())}
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                )}
              </div>
            }
          >
            {currentWorkspace.collections && currentWorkspace.collections.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FolderOpen size={16} />
                  <span>Collections ({currentWorkspace.collections.length})</span>
                </div>
                <div className="space-y-1">
                  {currentWorkspace.collections.slice(0, 5).map((collection: any) => (
                    <div
                      key={collection.id}
                      className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    >
                      {collection.name}
                    </div>
                  ))}
                  {currentWorkspace.collections.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                      +{currentWorkspace.collections.length - 5} more collections
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {currentWorkspace.is_team && (
            <Card title="Team Members">
              <TeamMembersPanel workspaceId={currentWorkspace.id.toString()} />
            </Card>
          )}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewWorkspaceName("");
          setNewWorkspaceDesc("");
          setIsTeam(false);
        }}
        title="Create New Workspace"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setNewWorkspaceName("");
                setNewWorkspaceDesc("");
                setIsTeam(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateWorkspace}
              disabled={loading}
              loading={loading}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="e.g., Frontend Team, Backend Team"
            fullWidth
            autoFocus
            required
          />
          <Textarea
            label="Description (Optional)"
            value={newWorkspaceDesc}
            onChange={(e) => setNewWorkspaceDesc(e.target.value)}
            placeholder="Describe the purpose of this workspace..."
            rows={3}
            fullWidth
          />
          <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={isTeam}
              onChange={(e) => setIsTeam(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Team Workspace
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enable collaboration features like member invitations and shared collections
              </p>
            </div>
          </label>
        </div>
      </Modal>

      {showInviteModal && currentWorkspace && (
        <InviteMemberModal
          workspaceId={currentWorkspace.id.toString()}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}


