// Opt out of static generation — these routes always need live DB/KV access.
export const dynamic = "force-dynamic";

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
