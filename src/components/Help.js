import { tags } from "ziko/dom";
const {
    div, h1, span, h2, section, pre, table, tbody, tr, td
} = tags
export const Help = ({ version = '0.1.0'} = {}) =>
  div(
    pre(`
        -
    `),
    h1(
      `tatr ${version}`,
      span(" — filesystem task tracker")
    ).style({
        color : 'blue'
    }),

    section(
      h2("Usage"),

      pre(
        "tatr <command> [options]"
      )
    ),

    section(
      h2("Commands"),

      table(
        tbody(
          tr(
            td("new <title>"),
            td("Create a task")
          ),

          tr(
            td("ls [query]"),
            td("List tasks, optionally filtered by TQL")
          ),

          tr(
            td("show <id>"),
            td("Show a task")
          ),

          tr(
            td("edit <id>"),
            td("Edit TASK.md in $EDITOR")
          ),

          tr(
            td("close <id>"),
            td("Mark a task CLOSED")
          ),

          tr(
            td("reopen <id>"),
            td("Mark a task OPEN")
          ),

          tr(
            td("rm <id>"),
            td("Delete a task")
          ),

          tr(
            td("tags"),
            td("Show tag descriptions")
          ),

          tr(
            td("init"),
            td("Create tasks/")
          ),

          tr(
            td("help"),
            td("Show this help")
          ),

          tr(
            td("version"),
            td("Show the version")
          )
        )
      )
    ),

    section(
      h2("new options"),

      table(
        tbody(
          tr(
            td("--priority <n>"),
            td("Task priority (default: 0)")
          ),

          tr(
            td("--tags <a,b,c>"),
            td("Comma-separated tags")
          ),

          tr(
            td("--suffix <name>"),
            td("HUID suffix")
          ),

          tr(
            td("--description <x>"),
            td("Initial description")
          )
        )
      )
    ),

    section(
      h2("ls options"),

      table(
        tbody(
          tr(
            td("--all"),
            td("Include CLOSED tasks (default is all; kept for compatibility)")
          ),

          tr(
            td("--open"),
            td("Only OPEN tasks")
          ),

          tr(
            td("--closed"),
            td("Only CLOSED tasks")
          )
        )
      )
    ),

    section(
      h2("TQL examples"),

      pre(
        `tatr ls :bug
tatr ls ':bug and not :ui'
tatr ls 'not tagged'
tatr ls ':bug and priority lt 50'
tatr ls '[:bug or :enhancement] and priority ge 10'`
      )
    )
  );