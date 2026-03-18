import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus, LogOut, Mic } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title?: string;
  language: string;
  status: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    // Fetch conversations on mount
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = authService.getAccessToken();
      const response = await fetch("http://localhost:4001/api/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a conversation title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = authService.getAccessToken();
      const response = await fetch("http://localhost:4001/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          language: "en",
        }),
      });

      if (!response.ok) throw new Error("Failed to create conversation");

      const newConv = await response.json();
      setConversations([newConv, ...conversations]);
      setNewTitle("");
      toast({
        title: "Success",
        description: "Conversation created!",
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.clearTokens();
    navigate("/");
    toast({
      title: "Logged out",
      description: "See you soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-xl text-foreground">
              Vox<span className="text-primary">AI</span>
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Welcome */}
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Welcome back! Manage your voice conversations here.</p>
          </div>

          {/* Create New Conversation */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Create New Conversation</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter conversation title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && handleCreateConversation()}
              />
              <Button onClick={handleCreateConversation} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Your Conversations</h3>
            {conversations.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No conversations yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {conv.title || "Untitled Conversation"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(conv.createdAt).toLocaleDateString()} • {conv.language.toUpperCase()} • {conv.status}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
