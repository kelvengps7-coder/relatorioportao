import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  title?: string;
}

export const TableSkeleton = ({ rows = 5, columns = 4, title }: TableSkeletonProps) => {
  return (
    <Card>
      {title && (
        <CardHeader>
          <div className="h-6 w-48 skeleton rounded" />
        </CardHeader>
      )}
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i}>
                    <div className="h-4 w-20 skeleton rounded" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 w-full skeleton rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};