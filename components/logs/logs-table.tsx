"use client"

import { useState } from "react"
import { ActivityLogWithUser } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"

interface LogsTableProps {
  logs: ActivityLogWithUser[]
}

export function LogsTable({ logs: initialLogs }: LogsTableProps) {
  const [moduleFilter, setModuleFilter] = useState<string>("ALL")
  const [actionFilter, setActionFilter] = useState<string>("ALL")

  const filteredLogs = initialLogs.filter((log) => {
    const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter
    const matchesAction = actionFilter === "ALL" || log.actionType === actionFilter
    return matchesModule && matchesAction
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All Modules</option>
          <option value="INVENTORY">Inventory</option>
          <option value="FINANCE">Finance</option>
          <option value="PROJECTS">Projects</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>{log.user.name}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {log.module}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        log.actionType === "CREATE"
                          ? "bg-green-100 text-green-800"
                          : log.actionType === "UPDATE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.actionType}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.description || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No logs found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.user.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    log.actionType === "CREATE"
                      ? "bg-green-100 text-green-800"
                      : log.actionType === "UPDATE"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {log.actionType}
                </span>
              </div>
              <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {log.module}
              </span>
              {log.description && (
                <p className="text-sm text-muted-foreground">{log.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


