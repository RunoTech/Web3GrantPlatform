import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Users,
  DollarSign,
  Shield
} from "lucide-react";

interface CorporateVerification {
  id: number;
  wallet: string;
  companyName: string;
  companyEmail: string;
  companyRegistrationNumber: string;
  companyAddress: string;
  companyCEO: string;
  companyIndustry: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: number;
  adminNotes?: string;
  rejectionReason?: string;
  documents?: FundDocument[];
}

interface FundDocument {
  id: number;
  verificationId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

interface PendingFund {
  id: number;
  wallet: string;
  verificationId: number;
  campaignData: any;
  collateralAmount: string;
  collateralPaid: boolean;
  collateralTxHash?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function KYBVerificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState<CorporateVerification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch verifications
  const { data: verifications, isLoading: verificationsLoading } = useQuery({
    queryKey: ['/api/youhonor/kyb/verifications', selectedTab],
    queryFn: () => api.get(`/api/youhonor/kyb/verifications?status=${selectedTab === 'all' ? '' : selectedTab}`),
  });

  // Fetch pending funds
  const { data: pendingFunds, isLoading: fundsLoading } = useQuery({
    queryKey: ['/api/youhonor/kyb/pending-funds'],
    queryFn: () => api.get('/api/youhonor/kyb/pending-funds'),
  });

  // Fetch verification details
  const fetchVerificationDetails = async (id: number) => {
    try {
      const data = await api.get(`/api/youhonor/kyb/verification/${id}`);
      setSelectedVerification(data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch verification details",
        variant: "destructive",
      });
    }
  };

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return api.post(`/api/youhonor/kyb/verification/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youhonor/kyb/verifications'] });
      setIsApproveModalOpen(false);
      setApproveNotes('');
      toast({
        title: "Success",
        description: "Verification approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive",
      });
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return api.post(`/api/youhonor/kyb/verification/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youhonor/kyb/verifications'] });
      setIsRejectModalOpen(false);
      setRejectReason('');
      toast({
        title: "Success",
        description: "Verification rejected successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeName = (type: string) => {
    const types = {
      company_registration: "Company Registration",
      tax_certificate: "Tax Certificate",
      ceo_id: "CEO ID Document",
      bank_statement: "Bank Statement",
      business_license: "Business License"
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            KYB Verification Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage corporate fund verification requests
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-amber-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold" data-testid="pending-count">
                  {verifications?.filter((v: any) => v.status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold" data-testid="approved-count">
                  {verifications?.filter((v: any) => v.status === 'approved').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold" data-testid="rejected-count">
                  {verifications?.filter((v: any) => v.status === 'rejected').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Funds</p>
                <p className="text-2xl font-bold" data-testid="pending-funds-count">
                  {pendingFunds?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Verifications</CardTitle>
          <CardDescription>Review and manage KYB verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {verificationsLoading ? (
                <div className="text-center py-8">Loading verifications...</div>
              ) : !verifications?.length ? (
                <div className="text-center py-8 text-gray-500">
                  No verifications found for {selectedTab} status
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification: CorporateVerification) => (
                    <div
                      key={verification.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <h3 className="font-medium" data-testid={`company-name-${verification.id}`}>
                                {verification.companyName}
                              </h3>
                              <p className="text-sm text-gray-500">{verification.companyEmail}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>CEO: {verification.companyCEO}</span>
                            <span>Industry: {verification.companyIndustry}</span>
                            <span>Submitted: {new Date(verification.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(verification.status)}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchVerificationDetails(verification.id)}
                            data-testid={`button-view-${verification.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          {verification.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setIsApproveModalOpen(true);
                                }}
                                data-testid={`button-approve-${verification.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setIsRejectModalOpen(true);
                                }}
                                data-testid={`button-reject-${verification.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Verification Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedVerification?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="font-medium mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Company Name</p>
                    <p className="font-medium">{selectedVerification.companyName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Registration Number</p>
                    <p className="font-medium">{selectedVerification.companyRegistrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedVerification.companyEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CEO/Founder</p>
                    <p className="font-medium">{selectedVerification.companyCEO}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Industry</p>
                    <p className="font-medium">{selectedVerification.companyIndustry}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wallet Address</p>
                    <p className="font-mono text-xs">{selectedVerification.wallet}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{selectedVerification.companyAddress}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-medium mb-3">Uploaded Documents</h3>
                {selectedVerification.documents?.length ? (
                  <div className="space-y-2">
                    {selectedVerification.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{getDocumentTypeName(doc.documentType)}</p>
                            <p className="text-sm text-gray-500">{doc.fileName} • {Math.round(doc.fileSize / 1024)} KB</p>
                          </div>
                        </div>
                        <Badge variant="outline">{doc.mimeType}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No documents uploaded</p>
                )}
              </div>

              {/* Status Information */}
              <div>
                <h3 className="font-medium mb-3">Status Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    {getStatusBadge(selectedVerification.status)}
                  </div>
                  <p><span className="text-gray-500">Submitted:</span> {new Date(selectedVerification.submittedAt).toLocaleString()}</p>
                  {selectedVerification.verifiedAt && (
                    <p><span className="text-gray-500">Verified:</span> {new Date(selectedVerification.verifiedAt).toLocaleString()}</p>
                  )}
                  {selectedVerification.adminNotes && (
                    <div>
                      <p className="text-gray-500">Admin Notes:</p>
                      <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedVerification.adminNotes}</p>
                    </div>
                  )}
                  {selectedVerification.rejectionReason && (
                    <div>
                      <p className="text-gray-500">Rejection Reason:</p>
                      <p className="mt-1 p-2 bg-red-50 dark:bg-red-900 rounded text-red-700 dark:text-red-300">{selectedVerification.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Verification</DialogTitle>
            <DialogDescription>
              Approve the KYB verification for {selectedVerification?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Add any notes about the approval..."
                className="mt-1"
                data-testid="textarea-approve-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedVerification && approveMutation.mutate({ 
                id: selectedVerification.id, 
                notes: approveNotes 
              })}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving..." : "Approve Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Reject the KYB verification for {selectedVerification?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="mt-1"
                required
                data-testid="textarea-reject-reason"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVerification && rejectMutation.mutate({ 
                id: selectedVerification.id, 
                reason: rejectReason 
              })}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}