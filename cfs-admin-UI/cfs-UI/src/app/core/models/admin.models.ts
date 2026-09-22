export * from 'shared/types/client/client.interface';
export * from 'shared/types/site/site.interface';
export * from 'shared/types/role/role.interface';
export * from 'shared/types/user/user.interface';
export * from 'shared/types/gate-event/gate-event.interface';
export * from 'shared/types/auth/auth.interface';

import { Client } from 'shared/types/client/client.interface';
import { Site } from 'shared/types/site/site.interface';
import { Role } from 'shared/types/role/role.interface';
import { User } from 'shared/types/user/user.interface';

export type AdminEntity = Client | Site | Role | User;
