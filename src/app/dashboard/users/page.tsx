"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Trash2, FilePenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Debe ser un correo electrónico válido."),
  role: z.enum(["Administrador", "Analista de Tráfico", "Operador de Tráfico"], { required_error: "Debe seleccionar un rol." }),
});

type User = z.infer<typeof userSchema> & {
    id: string;
    avatar: string;
    initials: string;
};

const initialUsers: User[] = [
  {
    id: "1",
    name: "Carlos Vargas",
    email: "carlos.vargas@centinelavial.com",
    role: "Administrador",
    avatar: "https://i.pravatar.cc/150?u=carlos",
    initials: "CV",
  },
  {
    id: "2",
    name: "Sofía Reyes",
    email: "sofia.reyes@centinelavial.com",
    role: "Analista de Tráfico",
    avatar: "https://i.pravatar.cc/150?u=sofia",
    initials: "SR",
  },
  {
    id: "3",
    name: "Mateo Diaz",
    email: "mateo.diaz@centinelavial.com",
    role: "Operador de Tráfico",
    avatar: "https://i.pravatar.cc/150?u=mateo",
    initials: "MD",
  },
  {
    id: "4",
    name: "Valentina Castillo",
    email: "valentina.castillo@centinelavial.com",
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
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", role: undefined });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset(user);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${userToDelete.name} ha sido eliminado.`,
      });
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  function onSubmit(values: z.infer<typeof userSchema>) {
    const initials = values.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const avatar = `https://i.pravatar.cc/150?u=${values.email}`;
    
    if (editingUser) {
      // Update user
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values, avatar, initials } : u));
      toast({
        title: "Usuario Actualizado",
        description: `Los datos de ${values.name} han sido actualizados.`,
      });
    } else {
      // Add new user
      const newUser: User = {
        id: new Date().getTime().toString(),
        ...values,
        avatar,
        initials,
      };
      setUsers([newUser, ...users]);
       toast({
        title: "Usuario Creado",
        description: `El usuario ${values.name} ha sido creado exitosamente.`,
      });
    }
    setIsDialogOpen(false);
    setEditingUser(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administre las cuentas de usuario y los permisos.
          </p>
        </div>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Usuario
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Todos los Usuarios</CardTitle>
            <CardDescription>Una lista de todos los usuarios en el sistema Centinela Vial.</CardDescription>
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
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <FilePenLine className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                      {editingUser ? "Modifique los detalles del usuario a continuación." : "Complete el formulario para agregar un nuevo usuario al sistema."}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                       <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Nombre Completo</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Ej: Juan Pérez" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Correo Electrónico</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Ej: juan.perez@centinelavial.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Rol</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Seleccione un rol" />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          <SelectItem value="Administrador">Administrador</SelectItem>
                                          <SelectItem value="Analista de Tráfico">Analista de Tráfico</SelectItem>
                                          <SelectItem value="Operador de Tráfico">Operador de Tráfico</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <DialogClose asChild>
                              <Button type="button" variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button type="submit">{editingUser ? "Guardar Cambios" : "Crear Usuario"}</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de que desea eliminar este usuario?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta de 
                      <strong> {userToDelete?.name}</strong> y sus datos asociados.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
