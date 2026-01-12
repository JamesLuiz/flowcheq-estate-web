import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, AlertTriangle, DollarSign, Building, User, CheckCircle, XCircle, 
  Send, Users, RefreshCw, CreditCard, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface PendingDisbursement {
  agent: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pendingAmount: number;
  totalEarnings: number;
  recentEarnings: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
  hasBankAccount: boolean;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
  reason: string;
}

export const DisbursementsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAgent, setSelectedAgent] = useState<PendingDisbursement | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementReason, setDisbursementReason] = useState('');
  const [showDisbursementDialog, setShowDisbursementDialog] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const disbursementsQuery = useQuery({
    queryKey: ['admin-pending-disbursements'],
    queryFn: () => api.admin.getPendingDisbursements(),
  });

  const processDisbursementMutation = useMutation({
    mutationFn: ({ agentId, amount, reason }: { agentId: string; amount: number; reason?: string }) =>
      api.admin.processDisbursement(agentId, amount, reason),
    onSuccess: (data) => {
      toast({
        title: 'Disbursement Initiated',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-disbursements'] });
      setShowDisbursementDialog(false);
      setSelectedAgent(null);
      setDisbursementAmount('');
      setDisbursementReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Disbursement Failed',
        description: error.message,
      });
    },
  });

  const processBulkMutation = useMutation({
    mutationFn: (data: { disbursements: { agentId: string; amount: number }[]; reason?: string }) =>
      api.admin.processBulkDisbursements(data.disbursements, data.reason),
    onSuccess: (data) => {
      toast({
        title: 'Bulk Disbursement Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-disbursements'] });
      setShowBulkDialog(false);
      setSelectedForBulk(new Set());
      setBulkReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Bulk Disbursement Failed',
        description: error.message,
      });
    },
  });

  const disbursements = disbursementsQuery.data?.data || [];
  const totalPending = disbursementsQuery.data?.totalPending || 0;
  const pendingCount = disbursementsQuery.data?.count || 0;

  const handleOpenDisbursement = (agent: PendingDisbursement) => {
    setSelectedAgent(agent);
    setDisbursementAmount(String(agent.pendingAmount));
    setDisbursementReason('');
    setShowDisbursementDialog(true);
  };

  const handleProcessDisbursement = () => {
    if (!selectedAgent) return;
    const amount = parseFloat(disbursementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
      });
      return;
    }
    processDisbursementMutation.mutate({
      agentId: selectedAgent.agent.id,
      amount,
      reason: disbursementReason || undefined,
    });
  };

  const handleToggleForBulk = (agentId: string) => {
    const newSelected = new Set(selectedForBulk);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedForBulk(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedForBulk.size === disbursements.filter(d => d.hasBankAccount).length) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(disbursements.filter(d => d.hasBankAccount).map(d => d.agent.id)));
    }
  };

  const handleProcessBulk = () => {
    const selectedDisbursements = disbursements
      .filter(d => selectedForBulk.has(d.agent.id))
      .map(d => ({
        agentId: d.agent.id,
        amount: d.pendingAmount,
      }));

    if (selectedDisbursements.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Selection',
        description: 'Please select agents to disburse to',
      });
      return;
    }

    processBulkMutation.mutate({
      disbursements: selectedDisbursements,
      reason: bulkReason || undefined,
    });
  };

  const selectedBulkTotal = disbursements
    .filter(d => selectedForBulk.has(d.agent.id))
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  if (disbursementsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pending Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₦{totalPending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Selected for Bulk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedForBulk.size}</div>
            {selectedForBulk.size > 0 && (
              <p className="text-sm text-muted-foreground">₦{selectedBulkTotal.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {pendingCount > 0 && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Pending Disbursements</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {pendingCount} agent(s) have ₦{totalPending.toLocaleString()} pending for manual disbursement. 
            These are agents without virtual accounts or where split payments weren't configured.
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {disbursements.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedForBulk.size === disbursements.filter(d => d.hasBankAccount).length 
              ? 'Deselect All' 
              : 'Select All with Bank Account'}
          </Button>
          {selectedForBulk.size > 0 && (
            <Button
              onClick={() => setShowBulkDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Process {selectedForBulk.size} Disbursement(s) (₦{selectedBulkTotal.toLocaleString()})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disbursementsQuery.refetch()}
            disabled={disbursementsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${disbursementsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Disbursements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pending Manual Disbursements
          </CardTitle>
          <CardDescription>
            Agents requiring manual transfer of viewing fee earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disbursements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No pending disbursements</p>
              <p className="text-sm text-muted-foreground mt-2">
                All agent payments are being processed via split payments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedForBulk.size === disbursements.filter(d => d.hasBankAccount).length && disbursements.filter(d => d.hasBankAccount).length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disbursements.map((disbursement) => (
                    <TableRow key={disbursement.agent.id}>
                      <TableCell>
                        {disbursement.hasBankAccount ? (
                          <Checkbox
                            checked={selectedForBulk.has(disbursement.agent.id)}
                            onCheckedChange={() => handleToggleForBulk(disbursement.agent.id)}
                          />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{disbursement.agent.name}</p>
                          <p className="text-xs text-muted-foreground">{disbursement.agent.email}</p>
                          {disbursement.agent.phone && (
                            <p className="text-xs text-muted-foreground">{disbursement.agent.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {disbursement.hasBankAccount && disbursement.bankAccount ? (
                          <div>
                            <p className="text-sm flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {disbursement.bankAccount.bankName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {disbursement.bankAccount.accountNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {disbursement.bankAccount.accountName}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="destructive">No Bank Account</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-lg text-amber-600">
                            ₦{disbursement.pendingAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Earnings: ₦{disbursement.totalEarnings.toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={disbursement.hasBankAccount ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {disbursement.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleOpenDisbursement(disbursement)}
                          disabled={!disbursement.hasBankAccount}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Disburse
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Disbursement Dialog */}
      <Dialog open={showDisbursementDialog} onOpenChange={setShowDisbursementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Disbursement</DialogTitle>
            <DialogDescription>
              Transfer funds to {selectedAgent?.agent.name}'s bank account
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <Alert>
                <User className="h-4 w-4" />
                <AlertTitle>{selectedAgent.agent.name}</AlertTitle>
                <AlertDescription>
                  {selectedAgent.bankAccount && (
                    <div className="mt-2">
                      <p><strong>Bank:</strong> {selectedAgent.bankAccount.bankName}</p>
                      <p><strong>Account:</strong> {selectedAgent.bankAccount.accountNumber}</p>
                      <p><strong>Name:</strong> {selectedAgent.bankAccount.accountName}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                  max={selectedAgent.pendingAmount}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: ₦{selectedAgent.pendingAmount.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={disbursementReason}
                  onChange={(e) => setDisbursementReason(e.target.value)}
                  placeholder="e.g., Manual viewing fee disbursement"
                />
              </div>

              {selectedAgent.recentEarnings.length > 0 && (
                <div className="space-y-2">
                  <Label>Recent Earnings</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedAgent.recentEarnings.map((earning) => (
                      <div key={earning.id} className="text-xs p-2 bg-muted rounded flex justify-between">
                        <span>{earning.description || earning.type}</span>
                        <span className="font-semibold">₦{earning.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisbursementDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessDisbursement}
              disabled={processDisbursementMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {processDisbursementMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process Disbursement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Disbursement Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Disbursement</DialogTitle>
            <DialogDescription>
              Process disbursements for {selectedForBulk.size} selected agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">Confirm Bulk Transfer</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                You are about to process ₦{selectedBulkTotal.toLocaleString()} in disbursements 
                to {selectedForBulk.size} agents. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {disbursements
                .filter(d => selectedForBulk.has(d.agent.id))
                .map(d => (
                  <div key={d.agent.id} className="flex justify-between p-2 bg-muted rounded text-sm">
                    <span>{d.agent.name}</span>
                    <span className="font-semibold">₦{d.pendingAmount.toLocaleString()}</span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkReason">Reason (Optional)</Label>
              <Textarea
                id="bulkReason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="e.g., Weekly viewing fee disbursement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessBulk}
              disabled={processBulkMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {processBulkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process All ({selectedForBulk.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
