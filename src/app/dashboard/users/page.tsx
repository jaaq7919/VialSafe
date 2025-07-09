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
    name: "Carlos Vargas",
    email: "carlos.vargas@viasegura.com",
    role: "Administrador",
    avatar: "https://i.pravatar.cc/150?u=carlos",
    initials: "CV",
  },
  {
    name: "Sofía Reyes",
    email: "sofia.reyes@viasegura.com",
    role: "Analista de Tráfico",
    avatar: "https://i.pravatar.cc/150?u=sofia",
    initials: "SR",
  },
  {
    name: "Mateo Diaz",
    email: "mateo.diaz@viasegura.com",
    role: "Operador de Tráfico",
    avatar: "https://i.pravatar.cc/150?u=mateo",
    initials: "MD",
  },
    {
    name: "Valentina Castillo",
    email: "valentina.castillo@viasegura.com",
    role: "Operador de Tráfico",
    avatar: "https://i.pravatar.cc/150?u=valentina",
    initials: "VC",
  },
];

const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
  Administrador: "default",
  "Analista de Tráfico": "secondary",
  "Operador de Tráfico": "outline",
};

export default function UsersPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administre las cuentas de usuario y los permisos.
          </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Usuario
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Todos los Usuarios</CardTitle>
            <CardDescription>Una lista de todos los usuarios en el sistema VíaSegura.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Eliminar
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
