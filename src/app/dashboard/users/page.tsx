import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle } from "lucide-react";

const users = [
  {
    name: "John Doe",
    email: "john.doe@vialsafe.com",
    role: "Administrator",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    initials: "JD",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@vialsafe.com",
    role: "Traffic Analyst",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
    initials: "JS",
  },
  {
    name: "Peter Jones",
    email: "peter.jones@vialsafe.com",
    role: "Traffic Operator",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
    initials: "PJ",
  },
    {
    name: "Sarah Miller",
    email: "sarah.miller@vialsafe.com",
    role: "Traffic Operator",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026707d",
    initials: "SM",
  },
];

const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
  Administrator: "default",
  "Traffic Analyst": "secondary",
  "Traffic Operator": "outline",
};

export default function UsersPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions.
          </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all users in the VialSafe system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
