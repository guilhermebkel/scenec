import { WorkspaceGroup } from "@/Resources/Groups/WorkspaceGroup.ts";
import { ReadingCornerGroup } from "@/Resources/Groups/ReadingCornerGroup.ts";
import { DiningGroup } from "@/Resources/Groups/DiningGroup.ts";
import { ConversationGroup } from "@/Resources/Groups/ConversationGroup.ts";
import { ParkBenchGroup } from "@/Resources/Groups/ParkBenchGroup.ts";
import { CelebrationGroup } from "@/Resources/Groups/CelebrationGroup.ts";
import { MeetingGroup } from "@/Resources/Groups/MeetingGroup.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class GroupService {
  // Grupos prontos: um objeto `group: <nome>` vira várias peças já arrumadas entre si.
// Os ids gerados são <id>_<peça> (ex.: canto_pessoa), e podem ser referenciados de fora (look, on, left_of...).
// Parâmetros comuns: at, depth, size, flip (espelha), person/people (sobrescreve personagens),
// parts: { peça: {...campos} | false } para ajustar ou remover peças, color (cor principal do móvel).

  private static readonly REL = ["left_of", "right_of", "behind", "in_front_of", "on", "under", "above", "holds", "look"];

  static readonly GROUPS: Record<string, BaseGroup> = Object.fromEntries(
    [new WorkspaceGroup(), new ReadingCornerGroup(), new DiningGroup(), new ConversationGroup(), new ParkBenchGroup(), new CelebrationGroup(), new MeetingGroup()].map((group) => [group.id, group]),
  );

  private static readonly SIZES: Record<string, any> = { tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7 };

  private static readonly flipSide = (v: any) => (v === "left" ? "right" : v === "right" ? "left" : v);

  static expandGroups(objs: Record<string, any>, warnings: string[]): Record<string, any> {
    const out: Record<string, any> = {}, alias: Record<string, string> = {};
    for (const [id, o] of Object.entries(objs || {})) {
      if (!o?.group) { out[id] = o; continue; }
      const G = GroupService.GROUPS[o.group];
      if (!G) { warnings.push(`group '${o.group}' (in '${id}') does not exist; available: ${Object.keys(GroupService.GROUPS).join(", ")}`); continue; }
      const parts = G.build({ ...o, at: o.at ?? 0.5 });
      const removed = new Set();
      for (const [k, v] of Object.entries(o.parts || {})) {
        if (v === false) { delete parts[k]; removed.add(k); } else if (parts[k]) { parts[k] = { ...parts[k], ...(v as object) }; } else { parts[k] = v; } // peça extra
      }
      const pre = (ref: any) => (typeof ref === "string" && parts[ref] ? `${id}_${ref}` : removed.has(ref) ? undefined : ref);
      for (const [k, p] of Object.entries(parts)) {
        const q: Record<string, any> = { ...(p as object) };
        for (const r of GroupService.REL) { if (q[r] != null) { q[r] = Array.isArray(q[r]) ? q[r].map(pre) : pre(q[r]); } }
        for (const key of Object.keys(q)) { if (q[key] === undefined) { delete q[key]; } }
        if (o.depth && !q.on && !q.depth) { q.depth = o.depth; }
        // tamanho do grupo: só para peças que não herdam escala (as apoiadas/seguradas herdam do suporte)
        if (o.size != null && !q.on && !q.holds) {
          const k0 = typeof q.size === "number" ? q.size : GroupService.SIZES[q.size] ?? 1;
          q.size = k0 * (typeof o.size === "number" ? o.size : GroupService.SIZES[o.size] ?? 1);
        }
        if (o.flip) {
          if (q.left_of || q.right_of) { const l = q.left_of; q.left_of = q.right_of; q.right_of = l; if (q.left_of == null) { delete q.left_of; } if (q.right_of == null) { delete q.right_of; } }
          q.facing = GroupService.flipSide(q.facing);
          if (typeof q.align === "number") { q.align = -q.align; } else { q.align = GroupService.flipSide(q.align); }
          if (typeof q.offset === "number") { q.offset = -q.offset; }
          for (const key of ["facing", "align"]) { if (q[key] == null) { delete q[key]; } }
        }
        out[`${id}_${k}`] = q;
      }
      alias[id] = `${id}_${G.anchor}`;
    }
    // referências ao id do grupo apontam para a peça âncora
    for (const o of Object.values(out)) { for (const r of GroupService.REL) { if (typeof o[r] === "string" && alias[o[r]]) { o[r] = alias[o[r]]; } } }
    return out;
  }
}
