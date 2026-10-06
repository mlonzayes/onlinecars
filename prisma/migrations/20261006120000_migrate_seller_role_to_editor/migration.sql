-- El rol "seller" lo asignaban las invitaciones de vendedores, pero no existía
-- en USER_ROLES (admin | editor | viewer). Se unifica en "editor": mismos
-- permisos que tenía de hecho (carga y edita stock, no toca costos ni config).
UPDATE "dealership_users" SET "role" = 'editor' WHERE "role" = 'seller';
UPDATE "dealership_invites" SET "role" = 'editor' WHERE "role" = 'seller';

ALTER TABLE "dealership_invites" ALTER COLUMN "role" SET DEFAULT 'editor';
