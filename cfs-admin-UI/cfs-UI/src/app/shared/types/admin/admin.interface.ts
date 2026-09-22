export * from '../client/client.interface';
export * from '../site/site.interface';
export * from '../role/role.interface';
export * from '../user/user.interface';
export * from '../gate-event/gate-event.interface';
export * from '../auth/auth.interface';

import { Client } from '../client/client.interface';
import { Site } from '../site/site.interface';
import { Role } from '../role/role.interface';
import { User } from '../user/user.interface';

export type AdminEntity = Client | Site | Role | User;
