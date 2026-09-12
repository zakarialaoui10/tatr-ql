import { tags } from "ziko/dom"
const { table, tbody, tr, td} = tags
export const ShowTask = ({id, title, status, priority, tags} = {}) => table(
    tbody(
      tr(td("ID"),       td(id)),
      tr(td("TITLE"),    td(title)),
      tr(td("STATUS"),   td(status)),
      tr(td("PRIORITY"), td(priority)),
      tr(td("TAGS"),     td(tags.join(", ")))
    )
  )