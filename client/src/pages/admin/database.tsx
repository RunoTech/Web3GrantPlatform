import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import * as Icons from "lucide-react";

interface TableInfo {
  name: string;
  label: string;
  icon?: string;
  description?: string;
  recordCount: number;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  sensitiveTable: boolean;
}

interface ColumnConfig {
  key: string;
  label: string;
  type: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  hidden?: boolean;
  mask?: string;
  enumValues?: string[];
}

interface TableConfig {
  name: string;
  label: string;
  icon?: string;
  description?: string;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  columns: ColumnConfig[];
  defaultSort?: { column: string; direction: "asc" | "desc" };
  rowsPerPage?: number;
  primaryKey?: string;
  sensitiveTable?: boolean;
  auditAccess?: boolean;
}

export default function AdminDatabase() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Fetch table list
  const { data: tablesData, isLoading: isLoadingTables } = useQuery<{ success: boolean; tables: TableInfo[] }>({
    queryKey: ["/api/youhonor/data/tables"],
    retry: 1,
  });

  // Fetch table configuration
  const { data: configData } = useQuery<{ success: boolean; config: TableConfig }>({
    queryKey: ["/api/youhonor/data", selectedTable, "config"],
    enabled: !!selectedTable,
  });

  const tableConfig: TableConfig | undefined = configData?.config;

  // Fetch table data
  const { data: tableData, isLoading: isLoadingData, refetch: refetchData } = useQuery({
    queryKey: ["/api/youhonor/data", selectedTable, currentPage, searchTerm, sortColumn, sortDirection, filters],
    enabled: !!selectedTable && !!tableConfig,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", (tableConfig?.rowsPerPage || 50).toString());
      if (searchTerm) params.append("search", searchTerm);
      if (sortColumn) {
        params.append("sortColumn", sortColumn);
        params.append("sortDirection", sortDirection);
      }
      if (Object.keys(filters).length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      const response = await fetch(`/api/youhonor/data/${selectedTable}?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch table data");
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/youhonor/data/${selectedTable}/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Record deleted successfully" });
      refetchData();
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/youhonor/data/${selectedTable}/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export data");
      return response.json();
    },
    onSuccess: (data) => {
      // Download as JSON
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTable}_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Data exported successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const tables: TableInfo[] = tablesData?.tables || [];
  const records = tableData?.data || [];
  const total = tableData?.total || 0;
  const totalPages = tableData?.totalPages || 1;

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSearchTerm("");
    setFilters({});
    setSortColumn(undefined);
    setSortDirection("desc");
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleDelete = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      deleteMutation.mutate(selectedRecord.id);
    }
  };

  const renderCellValue = (value: any, column: ColumnConfig) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    // Handle masked values
    if (column.mask && !showSensitiveData) {
      return (
        <div className="flex items-center gap-2">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">[Protected]</span>
        </div>
      );
    }

    switch (column.type) {
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );
      case "date":
      case "datetime":
        return new Date(value).toLocaleString();
      case "decimal":
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value;
      case "wallet":
      case "txhash":
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {value.substring(0, 10)}...{value.substring(value.length - 8)}
          </code>
        );
      case "json":
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate block">
            {JSON.stringify(value).substring(0, 50)}...
          </code>
        );
      case "enum":
        return <Badge variant="outline">{value}</Badge>;
      default:
        if (typeof value === "string" && value.length > 100) {
          return <span className="truncate block max-w-xs">{value.substring(0, 100)}...</span>;
        }
        return value.toString();
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Database;
    const Icon = (Icons as any)[iconName];
    return Icon || Database;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/youhonor")}
            className="mb-4"
            data-testid="button-back-admin"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-8 w-8" />
                Database Explorer
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse and manage all platform database tables
              </p>
            </div>
            {selectedTable && tableConfig?.permissions.export && (
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Table List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tables ({tables.length})</CardTitle>
                <CardDescription>Select a table to view</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingTables ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading tables...
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    {tables.map((table) => {
                      const Icon = getIcon(table.icon);
                      const isSelected = selectedTable === table.name;
                      return (
                        <button
                          key={table.name}
                          onClick={() => handleTableSelect(table.name)}
                          className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${
                            isSelected ? "bg-accent" : ""
                          }`}
                          data-testid={`button-select-${table.name}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Icon className="h-4 w-4 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{table.label}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {table.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {table.recordCount}
                              </Badge>
                              {table.sensitiveTable && (
                                <Lock className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Table Data */}
          <div className="lg:col-span-3">
            {!selectedTable ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Table Selected</h3>
                  <p className="text-muted-foreground">
                    Select a table from the sidebar to view its data
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getIcon(tableConfig?.icon) && (
                          <span>{getIcon(tableConfig?.icon)({ className: "h-5 w-5" })}</span>
                        )}
                        {tableConfig?.label || selectedTable}
                        {tableConfig?.sensitiveTable && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Sensitive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{tableConfig?.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {tableConfig?.sensitiveTable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSensitiveData(!showSensitiveData)}
                          data-testid="button-toggle-sensitive"
                        >
                          {showSensitiveData ? (
                            <EyeOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          {showSensitiveData ? "Hide" : "Show"} Sensitive
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchData()}
                        data-testid="button-refresh"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="mb-4 flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="max-w-sm"
                        data-testid="input-search"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  {isLoadingData ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Loading data...
                    </div>
                  ) : records.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      No records found
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {tableConfig?.columns
                                  .filter((col) => !col.hidden)
                                  .map((column) => (
                                    <TableHead
                                      key={column.key}
                                      className={column.sortable ? "cursor-pointer select-none" : ""}
                                      onClick={() => column.sortable && handleSort(column.key)}
                                    >
                                      <div className="flex items-center gap-2">
                                        {column.label}
                                        {column.sortable && (
                                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TableHead>
                                  ))}
                                <TableHead className="w-[100px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {records.map((record: any, idx: number) => (
                                <TableRow key={record.id || idx}>
                                  {tableConfig?.columns
                                    .filter((col) => !col.hidden)
                                    .map((column) => (
                                      <TableCell key={column.key}>
                                        {renderCellValue(record[column.key], column)}
                                      </TableCell>
                                    ))}
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {tableConfig?.permissions.delete && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(record)}
                                          data-testid={`button-delete-${record.id}`}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Pagination */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * (tableConfig?.rowsPerPage || 50)) + 1} to{" "}
                          {Math.min(currentPage * (tableConfig?.rowsPerPage || 50), total)} of {total} records
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            data-testid="button-prev-page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            data-testid="button-next-page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
