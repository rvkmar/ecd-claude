import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useCreatePolicy, useUpdatePolicy } from "@/api/queries/policies";

export function PolicyBuilder({ policy, onCancel, onSaved }) {
  const [name, setName] = useState(policy?.name || "");
  const [type, setType] = useState(policy?.type || "fixed");
  const [description, setDescription] = useState(policy?.description || "");
  const [config, setConfig] = useState(
    policy?.config ? JSON.stringify(policy.config, null, 2) : "{}"
  );

  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const saving = createPolicy.isPending || updatePolicy.isPending;

  async function handleSubmit(e) {
    e.preventDefault();

    let payload;
    try {
      payload = {
        name,
        type,
        description,
        config: JSON.parse(config || "{}"),
      };
    } catch (err) {
      console.error("Error parsing policy config:", err);
      toast.error("Config must be valid JSON.");
      return;
    }

    const onSettled = {
      onSuccess: () => {
        toast.success(`Policy ${policy ? "updated" : "created"} successfully!`);
        onSaved();
      },
      onError: (err) => {
        console.error("Error saving policy:", err);
        toast.error("Failed to save policy. Check console for details.");
      },
    };

    if (policy) {
      updatePolicy.mutate({ id: policy.id, payload }, onSettled);
    } else {
      createPolicy.mutate(payload, onSettled);
    }
  }

  return (
    <Card className="mt-4 p-4">
      <CardHeader>
        <CardTitle>{policy ? "Edit Policy" : "New Policy"}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="border rounded-md px-3 py-2 w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="fixed">Fixed</option>
              <option value="IRT">IRT</option>
              <option value="BayesianNetwork">Bayesian Network</option>
              <option value="MarkovChain">Markov Chain</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="config">Config (JSON)</Label>
            <Textarea
              id="config"
              rows={6}
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Example: {"{ \"model\": \"2PL\", \"maxEntropy\": true }"}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
