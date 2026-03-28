import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, Save } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { integrationService } from "@/services/integration.service";
import { API_BASE } from "@/lib/api-config";

export default function Integrations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["integration-settings"],
    queryFn: () => integrationService.getSettings(),
  });

  const [botName, setBotName] = useState("");
  const [themeColor, setThemeColor] = useState("#5A67D8");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (!data) {
      return;
    }

    setBotName(data.botName);
    setThemeColor(data.themeColor);
    setPosition(data.position);
    setLanguage(data.language);
  }, [data]);

  const effectiveData = useMemo(() => {
    return data
      ? {
          ...data,
          botName: botName || data.botName,
          themeColor: themeColor || data.themeColor,
          position,
          language,
        }
      : null;
  }, [botName, data, language, position, themeColor]);

  const saveMutation = useMutation({
    mutationFn: () =>
      integrationService.updateSettings({
        botName: botName || data?.botName || "Assistant",
        themeColor: themeColor || data?.themeColor || "#5A67D8",
        position,
        language,
      }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["integration-settings"], updated);
      setBotName(updated.botName);
      setThemeColor(updated.themeColor);
      setPosition(updated.position);
      setLanguage(updated.language);
      toast({ title: "Saved", description: "Integration settings updated." });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unable to save settings",
        variant: "destructive",
      });
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: () => integrationService.regenerateKey(),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["integration-settings"], updated);
      toast({ title: "Embed key rotated", description: "Update your website snippet with the new key." });
    },
    onError: (error) => {
      toast({
        title: "Rotation failed",
        description: error instanceof Error ? error.message : "Unable to regenerate key",
        variant: "destructive",
      });
    },
  });

  const scriptSnippet = useMemo(() => {
    if (!effectiveData) {
      return "";
    }

    const scriptHost = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";

    return `<script src="${scriptHost}/chatbot.js" data-embed-key="${effectiveData.embedKey}" data-api-base="${API_BASE}" data-theme="${effectiveData.themeColor}" data-position="${effectiveData.position}" data-language="${effectiveData.language}" data-bot-name="${effectiveData.botName}"><\/script>`;
  }, [effectiveData]);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(scriptSnippet);
    toast({ title: "Copied", description: "Embed snippet copied to clipboard." });
  };

  if (isLoading || !data) {
    return (
      <DashboardShell title="Integrations" description="Install your chatbot on any website using an embeddable widget.">
        <Card><CardContent className="py-8">Loading integration settings...</CardContent></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Integrations" description="Install your chatbot on any website using an embeddable widget.">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Widget Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Bot Name</label>
              <Input value={botName || data.botName} onChange={(event) => setBotName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Theme Color</label>
              <Input value={themeColor || data.themeColor} onChange={(event) => setThemeColor(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Position</label>
              <select
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={position || data.position}
                onChange={(event) => setPosition(event.target.value as "bottom-right" | "bottom-left")}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Language</label>
              <select
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={language || data.language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="min-h-11">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => regenerateKeyMutation.mutate()} disabled={regenerateKeyMutation.isPending} className="min-h-11">
                {regenerateKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                Regenerate Key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed Script</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Paste this script before the closing `&lt;/body&gt;` tag on your website.</p>
            <Textarea value={scriptSnippet} readOnly rows={8} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button onClick={copySnippet} className="min-h-11">
                <Copy className="w-4 h-4 mr-2" />
                Copy Snippet
              </Button>
            </div>
            <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
              1. Copy the script above.
              <br />2. Paste it into your website HTML.
              <br />3. Publish your site and the chatbot appears as a floating button.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
