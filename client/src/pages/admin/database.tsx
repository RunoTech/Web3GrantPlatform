import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings, 
  Coins, 
  Calendar,
  Trophy,
  Building,
  UserCheck,
  FileText,
  MessageSquare,
  Activity,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DatabaseTable {
  name: string;
  icon: any;
  description: string;
  columns: string[];
  primaryKey: string;
}

// Database table definitions
const databaseTables: DatabaseTable[] = [
  {
    name: "accounts",
    icon: Users,
    description: "User wallet accounts and activation status",
    columns: ["id", "wallet", "active", "activationTxHash", "activationDate", "createdAt"],
    primaryKey: "id"
  },
  {
    name: "campaigns",
    icon: Building,
    description: "Donation and fund campaigns",
    columns: ["id", "title", "description", "targetAmount", "raisedAmount", "creatorWallet", "campaignType", "status", "endDate", "createdAt"],
    primaryKey: "id"
  },
  {
    name: "donations",
    icon: Coins,
    description: "All donation transactions",
    columns: ["id", "campaignId", "donorWallet", "amount", "txHash", "blockNumber", "createdAt"],
    primaryKey: "id"
  },
  {
    name: "dailyEntries",
    icon: Calendar,
    description: "Daily reward participation entries",
    columns: ["id", "wallet", "date", "entryHash", "createdAt"],
    primaryKey: "id"
  },
  {
    name: "dailyWinners",
    icon: Trophy,
    description: "Daily reward winners and prizes",
    columns: ["id", "wallet", "date", "amount", "txHash", "drawType", "position", "createdAt"],
    primaryKey: "id"
  },
  {
    name: "admins",
    icon: UserCheck,
    description: "Admin user accounts and roles",
    columns: ["id", "username", "email", "role", "active", "createdAt", "updatedAt"],
    primaryKey: "id"
  },
  {
    name: "platformSettings",
    icon: Settings,
    description: "Platform configuration settings",
    columns: ["id", "key", "value", "description", "category", "dataType", "updatedAt", "updatedBy"],
    primaryKey: "id"
  },
  {
    name: "networkFees",
    icon: Coins,
    description: "Network activation fees configuration",
    columns: ["id", "network", "tokenSymbol", "tokenAddress", "decimals", "amount", "active", "createdAt", "updatedAt"],
    primaryKey: "id"
  },
  {
    name: "footerLinks",
    icon: FileText,
    description: "Footer navigation links",
    columns: ["id", "title", "url", "section", "orderIndex", "active", "createdAt", "updatedAt"],
    primaryKey: "id"
  },
  {
    name: "announcements",
    icon: MessageSquare,
    description: "Platform announcements",
    columns: ["id", "title", "content", "type", "active", "startDate", "endDate", "createdAt", "updatedAt"],
    primaryKey: "id"
  },
  {
    name: "adminLogs",
    icon: Activity,
    description: "Admin activity logs",
    columns: ["id", "adminId", "action", "tableName", "recordId", "changes", "ipAddress", "userAgent", "createdAt"],
    primaryKey: "id"
  }
];

export default function DatabaseAdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string>("accounts");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Fetch table data
  const { data: tableData = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-table", selectedTable, currentPage, pageSize, searchTerm],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/youhonor/database/${selectedTable}?page=${currentPage}&limit=${pageSize}&search=${searchTerm}`);
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch table stats
  const { data: tableStats = { total: 0 } } = useQuery<{ total: number }>({
    queryKey: ["admin-table-stats", selectedTable],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/youhonor/database/${selectedTable}/stats`);
      return response || { total: 0 };
    },
  });

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingRecord 
        ? `/api/youhonor/database/${selectedTable}/${editingRecord.id}`
        : `/api/youhonor/database/${selectedTable}`;
      const method = editingRecord ? "PUT" : "POST";
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingRecord ? "Record updated successfully" : "Record created successfully",
      });
      setIsDialogOpen(false);
      setEditingRecord(null);
      setFormData({});
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/youhonor/database/${selectedTable}/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Delete failed",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: () => apiRequest("GET", `/api/youhonor/database/${selectedTable}/export`),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    },
  });

  const currentTable = databaseTables.find(table => table.name === selectedTable);
  const IconComponent = currentTable?.icon || Database;

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData(record);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    createUpdateMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatValue = (value: any, column: string) => {
    if (value === null || value === undefined) return "-";
    if (column.includes("Date") || column.includes("At")) {
      return new Date(value).toLocaleString();
    }
    if (column.includes("Hash") || column.includes("wallet")) {
      return typeof value === 'string' && value.length > 20 
        ? `${value.slice(0, 8)}...${value.slice(-6)}`
        : value;
    }
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + "...";
    }
    return String(value);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Database Administration</h1>
          <p className="text-muted-foreground">Complete database management and control</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTable} onValueChange={setSelectedTable} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11">
          {databaseTables.map((table) => {
            const Icon = table.icon;
            return (
              <TabsTrigger key={table.name} value={table.name} className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{table.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {databaseTables.map((table) => (
          <TabsContent key={table.name} value={table.name} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-8 h-8 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{table.name}</CardTitle>
                      <CardDescription>{table.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Total: {tableStats.total || 0}
                    </Badge>
                    <Button onClick={handleCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder={`Search ${table.name}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                      <SelectItem value="200">200 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.columns.map((column) => (
                            <TableHead key={column} className="whitespace-nowrap">
                              {column}
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={table.columns.length + 1} className="text-center py-8">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                              <p className="mt-2 text-muted-foreground">Loading...</p>
                            </TableCell>
                          </TableRow>
                        ) : tableData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={table.columns.length + 1} className="text-center py-8">
                              <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-muted-foreground">No records found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          tableData.map((record: any) => (
                            <TableRow key={record[table.primaryKey]}>
                              {table.columns.map((column) => (
                                <TableCell key={column} className="max-w-xs truncate">
                                  {formatValue(record[column], column)}
                                </TableCell>
                              ))}
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this record? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(record[table.primaryKey])}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, tableStats.total || 0)} to{' '}
                    {Math.min(currentPage * pageSize, tableStats.total || 0)} of {tableStats.total || 0} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value) || 1)}
                        className="w-16 text-center"
                        min="1"
                        max={Math.ceil((tableStats.total || 0) / pageSize)}
                      />
                      <span className="text-sm text-muted-foreground">
                        of {Math.ceil((tableStats.total || 0) / pageSize)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil((tableStats.total || 0) / pageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Record" : "Create New Record"}
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? "Update the selected record" : `Add a new record to ${selectedTable}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {currentTable?.columns.map((column) => {
              if (column === "id" && !editingRecord) return null;
              if (column.includes("createdAt") || column.includes("updatedAt")) return null;
              
              return (
                <div key={column} className="grid gap-2">
                  <Label htmlFor={column}>{column}</Label>
                  {column.includes("description") || column.includes("content") ? (
                    <Textarea
                      id={column}
                      value={formData[column] || ""}
                      onChange={(e) => setFormData({...formData, [column]: e.target.value})}
                      placeholder={`Enter ${column}...`}
                    />
                  ) : column.includes("active") || column.includes("boolean") ? (
                    <Select
                      value={formData[column]?.toString() || "false"}
                      onValueChange={(value) => setFormData({...formData, [column]: value === "true"})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={column}
                      value={formData[column] || ""}
                      onChange={(e) => setFormData({...formData, [column]: e.target.value})}
                      placeholder={`Enter ${column}...`}
                      type={column.includes("amount") || column.includes("decimals") || column.includes("orderIndex") ? "number" : "text"}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createUpdateMutation.isPending}>
              {createUpdateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}