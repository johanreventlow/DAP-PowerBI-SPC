# Anhøj-rules fixture generator for TypeScript-port
#
# Reference: qicharts2 v0.8.1 (Anhoej, Olesen)
# Output: test/Outlier Flagging/anhoj-fixtures.json
#
# Kør fra repo-rod for at regenerere fixtures hvis Anhøj-formlerne ændres:
#   Rscript "test/Outlier Flagging/anhoj-fixtures-gen.R"
#
# TypeScript-implementationen skal matche outputtet eksakt for hver fixture.

suppressPackageStartupMessages({
  library(qicharts2)
  library(jsonlite)
})

# ---- Anhøj-statistik (replikerer qicharts2's runs.analysis) ----
#
# n_useful        = antal observationer der IKKE ligger præcis på centerline
# longest_run     = længste sammenhængende sekvens på samme side af centerline
# n_crossings     = antal gange dataserien krydser centerline
# longest_run_max = round(log2(n_useful)) + 3       — øvre tærskel for normal variation
# n_crossings_min = qbinom(0.05, n_useful - 1, 0.5) — nedre tærskel for normal variation
#
# Signal udløses hvis longest_run > longest_run_max ELLER n_crossings < n_crossings_min
anhoj_stats <- function(values, centerline = NULL) {
  if (is.null(centerline)) centerline <- median(values, na.rm = TRUE)

  not_on_cl <- values != centerline & !is.na(values)
  n_useful  <- sum(not_on_cl)
  useful    <- values[not_on_cl]

  if (n_useful < 2L) {
    return(list(
      n_useful             = n_useful,
      longest_run          = NA_integer_,
      n_crossings          = NA_integer_,
      longest_run_max      = NA_integer_,
      n_crossings_min      = NA_integer_,
      long_run_signal      = FALSE,
      few_crossings_signal = FALSE
    ))
  }

  sides       <- ifelse(useful > centerline, 1L, -1L)
  rle_sides   <- rle(sides)
  longest_run <- as.integer(max(rle_sides$lengths))
  n_crossings <- as.integer(sum(diff(sides) != 0L))

  longest_run_max <- as.integer(round(log2(n_useful)) + 3L)
  n_crossings_min <- as.integer(qbinom(0.05, n_useful - 1L, 0.5))

  list(
    n_useful             = n_useful,
    longest_run          = longest_run,
    n_crossings          = n_crossings,
    longest_run_max      = longest_run_max,
    n_crossings_min      = n_crossings_min,
    long_run_signal      = longest_run > longest_run_max,
    few_crossings_signal = n_crossings < n_crossings_min
  )
}

# ---- Cross-check mod qicharts2's egen runs.analysis (intern) ----
# qicharts2 har ej eksporteret runs.analysis. Vi sammenligner via qic()-objektet,
# som indeholder summary-data inkl. longest.run + n.crossings.
qic_cross_check <- function(values) {
  q <- suppressMessages(qicharts2::qic(values, chart = "run", plot.chart = FALSE))
  s <- summary(q)
  list(
    longest_run   = as.integer(s$longest.run),
    n_crossings   = as.integer(s$n.crossings),
    runs_signal   = as.logical(s$runs.signal)
  )
}

# ---- Test-cases ----
# Dækker normal-variation, ren long-run, ren few-crossings, begge signaler,
# observationer-på-median, minimal-serie, alternerende ekstremer.
cases <- list(
  normal_series = c(5, 7, 4, 8, 6, 9, 3, 7, 5, 8, 4, 6, 7, 5, 9, 6, 4, 8, 5, 7),

  # 8 punkter konsekutivt over median efter en stabil start
  long_run_only = c(4, 6, 3, 7, 5, 4, 6, 11, 12, 10, 13, 11, 12, 10, 13, 11, 6, 4, 7, 5),

  # Få krydsninger: lange stræk på hver side, men ingen run >threshold isoleret
  few_crossings_only = c(2, 4, 3, 5, 4, 2, 3, 5, 9, 11, 10, 12, 11, 9, 10, 12),

  # Begge signaler udløses
  both_signals = c(2, 3, 1, 2, 3, 1, 2, 3, 1, 9, 10, 11, 9, 10, 11, 9, 10),

  # Observationer landed på medianen (skal ignoreres)
  on_median_edge = c(5, 5, 5, 3, 7, 5, 4, 8, 5, 6, 5, 5, 3, 7, 5, 4),

  # Minimal serie (n=10)
  minimal_series = c(1, 3, 2, 5, 4, 6, 5, 7, 6, 8),

  # Alternerende ekstremer (mange krydsninger, korte runs)
  alternating = c(1, 10, 2, 9, 3, 8, 4, 7, 5, 6, 1, 10, 2, 9, 3, 8),

  # Konstant under median (alle obs på samme side)
  all_one_side = c(3, 4, 2, 5, 3, 4, 2, 5, 3, 4, 8, 9, 10, 11, 12),

  # ---- Boundary cases — låser sammenligningsoperatorer (> vs ≥, < vs ≤) ----
  # Bruger 0/100-værdier med 10 zeros + 10 hundreds → median = 50, ingen ties, n_useful=20

  # longest_run_max for n_useful=20 = round(log2(20))+3 = 7
  # Run af præcis 7 → IKKE signal (operator skal være >, ej ≥)
  # Pattern: Z HHHHHHH Z H Z H Z H ZZZZZZ
  boundary_run_at_max = c(0, 100,100,100,100,100,100,100, 0,100,0,100,0,100, 0,0,0,0,0,0),

  # Run af 8 → lr_signal udløses (præcis over threshold)
  # Pattern: Z HHHHHHHH Z H Z H ZZZZZZZ
  boundary_run_over_max = c(0, 100,100,100,100,100,100,100,100, 0,100,0,100, 0,0,0,0,0,0,0),

  # n_crossings_min for n_useful=20 = qbinom(0.05, 19, 0.5) = 6
  # crossings = 6 → IKKE signal (operator <, ej ≤). 7 runs: ZZ HHH ZZ HHHH ZZ HHH ZZZZ
  boundary_crossings_at_min = c(0,0, 100,100,100, 0,0, 100,100,100,100, 0,0, 100,100,100, 0,0,0,0),

  # crossings = 5 → fc_signal. 6 runs: ZZZZ HHHH ZZZ HHH ZZZ HHH
  boundary_crossings_below_min = c(0,0,0,0, 100,100,100,100, 0,0,0, 100,100,100, 0,0,0, 100,100,100),

  # ---- Skala + degenerate edge ----

  # n=100 — verificér qbinom-impl ved skala
  large_n_normal = rep(c(8,9,3,2,9,8,2,3), 13)[1:100],

  # Alle obs præcis på median → n_useful = 0 (degenerate)
  all_ties = rep(5, 12)
)

# ---- Generér fixtures ----
fixtures <- lapply(names(cases), function(name) {
  vals  <- cases[[name]]
  stats <- anhoj_stats(vals)
  qcheck <- tryCatch(qic_cross_check(vals), error = function(e) NULL)

  list(
    name              = name,
    values            = vals,
    centerline_median = median(vals, na.rm = TRUE),
    stats             = stats,
    qicharts2_check   = qcheck
  )
})

# ---- Skriv JSON ----
out_path <- "test/Outlier Flagging/anhoj-fixtures.json"
writeLines(
  toJSON(fixtures, auto_unbox = TRUE, pretty = TRUE, digits = NA),
  out_path
)

# ---- Sanity-print ----
cat(sprintf("Skrev %d fixtures til %s\n\n", length(fixtures), out_path))
for (f in fixtures) {
  s <- f$stats
  cat(sprintf(
    "  %-22s  n_useful=%2d  longest_run=%d (max=%d)  crossings=%d (min=%d)  signals: lr=%s fc=%s\n",
    f$name, s$n_useful, s$longest_run, s$longest_run_max,
    s$n_crossings, s$n_crossings_min,
    s$long_run_signal, s$few_crossings_signal
  ))
}
