import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  MessageSquare 
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface AffiliateApplication {
  id: number;
  wallet: string;
  applicationText: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AffiliateApplicationResponse {
  success: boolean;
  applications: AffiliateApplication[];
}

export default function AdminAffiliatesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [reviewNotes, setReviewNotes] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch affiliate applications
  const { data: response, isLoading } = useQuery<AffiliateApplicationResponse>({
    queryKey: ["/api/youhonor/affiliate/applications", selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === "all" 
        ? "/api/youhonor/affiliate/applications"
        : `/api/youhonor/affiliate/applications?status=${selectedStatus}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/youhonor/affiliate/applications/${id}`, {
        status,
        reviewNotes: notes
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Application Updated",
          description: data.message,
        });
        // Clear review notes for this application
        setReviewNotes(prev => {
          const updated = { ...prev };
          const applicationId = updateStatusMutation.variables?.id;
          if (applicationId !== undefined) {
            delete updated[applicationId];
          }
          return updated;
        });
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/youhonor/affiliate/applications"] });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update application",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({
      id,
      status: "approved",
      notes: reviewNotes[id] || ""
    });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({
      id,
      status: "rejected",
      notes: reviewNotes[id] || ""
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const applications = response?.applications || [];
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/youhonor">
                <Button variant="outline" size="sm" data-testid="button-back-to-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Affiliate System</h1>
                  <p className="text-sm text-muted-foreground">Manage affiliate applications and approvals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">All time applications</p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card data-testid="card-approved-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Active affiliates</p>
            </CardContent>
          </Card>

          <Card data-testid="card-rejected-applications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">Rejected applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Applications</CardTitle>
            <CardDescription>
              Review and manage affiliate partnership applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Applications</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedStatus} className="space-y-4 mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                    <p className="text-muted-foreground">
                      {selectedStatus === "all" ? "No affiliate applications have been submitted yet." : 
                       `No ${selectedStatus} applications found.`}
                    </p>
                  </div>
                ) : (
                  applications.map((application) => (
                    <Card key={application.id} className="border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">Application #{application.id}</CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {application.wallet}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDistanceToNow(new Date(application.appliedAt))} ago
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Application Text */}
                        <div>
                          <Label className="text-sm font-medium">Application Message:</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <p className="text-sm">{application.applicationText}</p>
                          </div>
                        </div>

                        {/* Review Notes (if any) */}
                        {application.reviewNotes && (
                          <div>
                            <Label className="text-sm font-medium">Review Notes:</Label>
                            <div className="mt-1 p-3 bg-muted rounded-md">
                              <p className="text-sm">{application.reviewNotes}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Section for Pending Applications */}
                        {application.status === 'pending' && (
                          <div className="space-y-3 pt-4 border-t">
                            <Label htmlFor={`notes-${application.id}`} className="text-sm font-medium">
                              Review Notes (Optional):
                            </Label>
                            <Textarea
                              id={`notes-${application.id}`}
                              placeholder="Add review notes or feedback..."
                              value={reviewNotes[application.id] || ""}
                              onChange={(e) => setReviewNotes(prev => ({
                                ...prev,
                                [application.id]: e.target.value
                              }))}
                              className="min-h-[80px]"
                              data-testid={`textarea-review-notes-${application.id}`}
                            />
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => handleApprove(application.id)}
                                disabled={updateStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-approve-${application.id}`}
                              >
                                {updateStatusMutation.isPending && updateStatusMutation.variables?.id === application.id ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Application
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(application.id)}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-reject-${application.id}`}
                              >
                                {updateStatusMutation.isPending && updateStatusMutation.variables?.id === application.id ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Application
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Status History for Reviewed Applications */}
                        {application.status !== 'pending' && application.reviewedAt && (
                          <div className="pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">
                                {application.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                              {' '}
                              {formatDistanceToNow(new Date(application.reviewedAt))} ago
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}