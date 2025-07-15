
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { MoreHorizontal, PlusCircle, Trash2, FilePenLine, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUsers, addUser, updateUser, deleteUser, type UserProfile } from "@/services/users";

// Base schema without refinements
const baseUserSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  documentNumber: z.string().min(5, "El número de documento es muy corto."),
  email: z.string().email("Debe ser un correo electrónico válido."),
  phone: z.string().min(7, "El número de celular no es válido."),
  role: z.enum(["Administrador", "Analista de Tráfico", "Operador de Tráfico"], { required_error: "Debe seleccionar un rol." }),
  password: z.string().optional(),
});

// Extended schema to include optional id for editing
const userSchemaWithId = baseUserSchema.extend({
  id: z.string().optional(),
});

// Final schema with refinements for form validation
const userFormSchema = userSchemaWithId.refine(data => {
    // Password is required only if we are creating a new user (no id)
    if (!data.id && (!data.password || data.password.length < 6)) {
      return false;
    }
    return true;
}, {
    message: "La contraseña es obligatoria y debe tener al menos 6 caracteres.",
    path: ["password"],
}).refine(data => {
    // If we are editing and a new password is provided, it must be long enough
    if (data.id && data.password && data.password.length > 0 && data.password.length < 6) {
        return false;
    }
    return true;
}, {
    message: "La nueva contraseña debe tener al menos 6 caracteres.",
    path: ["password"],
});


type User = UserProfile;

const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
  Administrador: "default",
  "Analista de Tráfico": "secondary",
  "Operador de Tráfico": "outline",
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      documentNumber: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar usuarios",
        description: "No se pudieron obtener los datos de los usuarios.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({ firstName: "", lastName: "", documentNumber: "", email: "", phone: "", role: undefined, password: "" });
    form.clearErrors();
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({ ...user, id: user.uid, password: "" }); // Password no se carga por seguridad
    form.clearErrors();
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.uid);
        toast({
          title: "Perfil de Usuario Eliminado",
          description: `El perfil de ${userToDelete.firstName} ${userToDelete.lastName} ha sido eliminado de la base de datos.`,
        });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se pudo eliminar el perfil del usuario."
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  async function onSubmit(values: z.infer<typeof userFormSchema>) {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateValues: any = { ...values };
        if (!values.password) {
            delete updateValues.password; // No enviar la contraseña si está vacía
        }
        await updateUser(editingUser.uid, updateValues);
        toast({
          title: "Usuario Actualizado",
          description: `Los datos de ${values.firstName} ${values.lastName} han sido actualizados.`,
        });
      } else {
        await addUser(values as any);
        toast({
          title: "Usuario Creado",
          description: `El perfil para ${values.firstName} ha sido creado exitosamente.`,
        });
      }
      fetchUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
        console.error("Error submitting user:", error);
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: error.message || "No se pudo guardar el usuario. Verifique los datos o la consola.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administre los perfiles y cuentas de acceso de los usuarios del sistema.
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
            <CardDescription>Una lista de todos los perfiles de usuario en el sistema Centinela Vial.</CardDescription>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Perfil de Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                      {editingUser ? "Modifique los detalles del perfil. Deje la contraseña en blanco para no cambiarla." : "Complete el formulario para crear un nuevo perfil y su cuenta de acceso."}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Juan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="documentNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Documento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 123456789" {...field} />
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
                                      <Input type="email" placeholder="juan.perez@correo.com" {...field} disabled={!!editingUser} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Celular</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Ej: 3101234567" {...field} />
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
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                       <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Contraseña</FormLabel>
                                  <FormControl>
                                      <Input type="password" placeholder={editingUser ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"} {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                        />
                      <DialogFooter>
                          <DialogClose asChild>
                              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                          </DialogClose>
                          <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                          </Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de que desea eliminar este perfil?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción eliminará permanentemente el perfil de 
                      <strong> {userToDelete?.firstName} {userToDelete?.lastName}</strong> de la base de datos de la aplicación.
                      <br/><br/>
                      <span className="font-semibold text-destructive">Importante:</span> Esta acción no elimina la cuenta de autenticación del usuario. Para revocar completamente el acceso, debe eliminar al usuario desde la consola de Firebase Authentication.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar Perfil</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
