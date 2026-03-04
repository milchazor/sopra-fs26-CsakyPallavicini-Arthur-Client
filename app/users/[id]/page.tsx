"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Descriptions, Input, Modal } from "antd";
import { getApiDomain } from "@/utils/domain";

const Profile: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const [mounted, setMounted] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/login");
    }
  }, [mounted, token, router]);

  const handlePasswordChange = async (): Promise<void> => {
    try {
      await fetch(`${getApiDomain()}/users/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token ?? "" },
        body: JSON.stringify({ password: newPassword }),
      }).then((res) => { if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`); });
      setPasswordModalOpen(false);
      setNewPassword("");
      await handleLogout();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to change password:\n${error.message}`);
      }
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      if (userId) {
        await apiService.put(`/users/${userId}/logout`, {});
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser: User = await apiService.get<User>(`/users/${id}`);
        setUser(fetchedUser);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching user:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching user.");
        }
      }
    };

    if (id) {
      fetchUser();
    }
  }, [apiService, id]);

  return (
    <div className="card-container">
      <Card
        title="User Profile"
        loading={!user}
        extra={
          <Button onClick={() => router.push("/users")}>All Users</Button>
        }
      >
        {user && (
          <>
            <Descriptions column={1} bordered labelStyle={{color: "blue"}}>
              <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
              <Descriptions.Item label="Status">{user.status}</Descriptions.Item>
              <Descriptions.Item label="Bio">{user.bio ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Member Since">
                {user.creationDate
                  ? new Date(user.creationDate).toLocaleDateString()
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
            {String(userId) === String(id) && (
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Button onClick={() => setPasswordModalOpen(true)}>
                  Edit Password
                </Button>
                <Button type="primary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
            <Modal
              title="Change Password"
              open={passwordModalOpen}
              onOk={handlePasswordChange}
              onCancel={() => { setPasswordModalOpen(false); setNewPassword(""); }}
              okText="Save"
            >
              <Input.Password
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Modal>
          </>
        )}
      </Card>
    </div>
  );
};

export default Profile;
