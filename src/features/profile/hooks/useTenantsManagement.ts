import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

import {
  useCompanies,
  useAdmins,
  useCreateCompany,
  useUpdateCompanyStatus,
  useUpdateCompany,
  useCreateAdmin,
  useUpdateAdminStatus,
  useBootstrapDefaultTenant,
  useUpdateOwnCompany,
} from "../../../hooks/useData";
import { useAuth } from "../../../context/AuthContext";

export const useTenantsManagement = () => {
  const { user, updateUser } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: companiesData } = useCompanies(isSuperAdmin);
  const { data: adminsData } = useAdmins(isSuperAdmin);

  const createCompany = useCreateCompany();
  const updateCompanyStatus = useUpdateCompanyStatus();
  const updateCompany = useUpdateCompany();
  const updateOwnCompany = useUpdateOwnCompany();
  const createAdmin = useCreateAdmin();
  const updateAdminStatus = useUpdateAdminStatus();
  const bootstrapTenant = useBootstrapDefaultTenant();

  const [companyNameInput, setCompanyNameInput] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminCompanyId, setNewAdminCompanyId] = useState("");

  const userCompany =
    user?.companyId && typeof user.companyId === "object"
      ? {
          _id: user.companyId._id,
          name: user.companyId.name || "",
          slug: user.companyId.slug || "",
          address: user.companyId.address || "",
          isActive:
            typeof user.companyId.isActive === "boolean"
              ? user.companyId.isActive
              : true,
        }
      : null;

  const companies = isSuperAdmin
    ? companiesData?.data || []
    : userCompany?._id
      ? [userCompany]
      : [];
  const admins = adminsData?.data || [];

  useEffect(() => {
    if (!newAdminCompanyId && companies.length > 0) {
      setNewAdminCompanyId(companies[0]._id);
    }
  }, [companies, newAdminCompanyId]);

  const handleCreateCompany = () => {
    const name = companyNameInput.trim();
    if (!name) {
      addToast({ title: "Ingresá nombre de empresa", color: "danger" });
      return;
    }

    createCompany.mutate(
      { name },
      {
        onSuccess: () => {
          addToast({ title: "Empresa creada", color: "success" });
          setCompanyNameInput("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear la empresa",
            color: "danger",
          });
        },
      },
    );
  };

  const handleCreateAdmin = () => {
    if (!newAdminCompanyId) {
      addToast({ title: "Seleccioná una empresa", color: "danger" });
      return;
    }
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      addToast({
        title: "Usuario y contraseña son obligatorios",
        color: "danger",
      });
      return;
    }

    createAdmin.mutate(
      {
        username: newAdminUsername.trim(),
        password: newAdminPassword,
        phone: newAdminPhone.trim(),
        companyId: newAdminCompanyId,
        role: "admin",
      },
      {
        onSuccess: () => {
          addToast({ title: "Admin creado", color: "success" });
          setNewAdminUsername("");
          setNewAdminPassword("");
          setNewAdminPhone("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo crear admin",
            color: "danger",
          });
        },
      },
    );
  };

  const handleBootstrapTenant = () => {
    const name = companyNameInput.trim() || "Club Principal";
    bootstrapTenant.mutate(
      {
        name,
        assignAllUnassignedData: true,
        assignAllUnassignedAdmins: true,
      },
      {
        onSuccess: (response: any) => {
          const migrated =
            response?.data?.summary?.data?.bookings ??
            response?.data?.summary?.admins?.assigned ??
            0;
          addToast({
            title: `Bootstrap listo (${migrated} registros movidos)`,
            color: "success",
          });
          setCompanyNameInput("");
        },
        onError: (err: any) => {
          addToast({
            title: err?.response?.data?.error || "No se pudo hacer bootstrap",
            color: "danger",
          });
        },
      },
    );
  };

  const handleUpdateCompanyStatus = (id: string, isActive: boolean) => {
    if (isSuperAdmin) {
      updateCompanyStatus.mutate({ id, isActive });
    } else {
      addToast({
        title: "Solo superadmin puede activar/desactivar empresas",
        color: "warning",
      });
    }
  };

  const handleUpdateCompany = (
    id: string,
    data: { name?: string; slug?: string; address?: string; coverImage?: string },
  ) => {
    if (isSuperAdmin) {
      updateCompany.mutate(
        { id, data },
        {
          onSuccess: () => {
            addToast({ title: "Empresa actualizada", color: "success" });
          },
          onError: (err: any) => {
            addToast({
              title:
                err?.response?.data?.error ||
                "No se pudo actualizar la empresa",
              color: "danger",
            });
          },
        },
      );
    } else {
      updateOwnCompany.mutate(data, {
        onSuccess: (response: any) => {
          if (response?.data?.user) {
            updateUser(response.data.user);
          }
          addToast({ title: "Datos del club actualizados", color: "success" });
        },
        onError: (err: any) => {
          addToast({
            title:
              err?.response?.data?.error || "No se pudo actualizar el club",
            color: "danger",
          });
        },
      });
    }
  };

  const handleUpdateAdminStatus = (id: string, isActive: boolean) => {
    updateAdminStatus.mutate({ id, isActive });
  };

  return {
    isSuperAdmin,
    companies,
    admins,
    companyNameInput,
    newAdminUsername,
    newAdminPassword,
    newAdminPhone,
    newAdminCompanyId,
    createCompanyPending: createCompany.isPending,
    updateCompanyPending:
      updateCompany.isPending || updateOwnCompany.isPending,
    updateCompanyStatusPending: updateCompanyStatus.isPending,
    bootstrapPending: bootstrapTenant.isPending,
    createAdminPending: createAdmin.isPending,
    updateAdminStatusPending: updateAdminStatus.isPending,
    setCompanyNameInput,
    setNewAdminUsername,
    setNewAdminPassword,
    setNewAdminPhone,
    setNewAdminCompanyId,
    handleCreateCompany,
    handleBootstrapTenant,
    handleCreateAdmin,
    handleUpdateCompanyStatus,
    handleUpdateCompany,
    handleUpdateAdminStatus,
  };
};
