# I′-fixture-generator (normaliseret individkort) for TypeScript-porten
#
# Reference: qicharts2 v0.8.1, chart = "ip"
# Output:    test/Chart Types/ip-fixtures.json
#
# Kør fra repo-rod for at regenerere fixtures:
#   Rscript "test/Chart Types/ip-fixtures-gen.R"
#
# Scriptet er kun til generering — det er ikke en runtime-afhængighed.
#
# Bemærk: qicharts2 beregner moving-S over ALLE punkter i en fase, mens
# visualen (som qic.i og Taylor) kun bruger baselinen. Derfor ingen `freeze`
# her; baseline-adfærd testes med håndberegnede forventninger i ip.test.ts.
#
# Mapping af screening: qicharts2's option `qic.screenedmr = TRUE` svarer til
# visualens `outliers_in_limits = false`.

suppressPackageStartupMessages({
  library(qicharts2)
  library(jsonlite)
})

stopifnot(packageVersion("qicharts2") >= "0.8.1")

# qic() bruger deparse(substitute()) på sine argumenter, så vektorer sendes
# via `data` med faste kolonnenavne i stedet for som literaler.
# `part` er qicharts2's splitposition (sidste punkt i fase 1), ikke en kolonne.
run_qic <- function(screened, df, part = NULL) {
  old <- options(qic.screenedmr = screened)
  on.exit(options(old), add = TRUE)
  d <- if (!is.null(df$n) && !is.null(part)) {
    suppressMessages(qic(x, y, n, part = part, data = df, chart = "ip", return.data = TRUE))
  } else if (!is.null(df$n)) {
    suppressMessages(qic(x, y, n, data = df, chart = "ip", return.data = TRUE))
  } else {
    suppressMessages(qic(x, y, data = df, chart = "ip", return.data = TRUE))
  }
  d[order(d$x), ]
}

# Én fixture = samme input under begge screening-indstillinger.
make_fixture <- function(name, description, keys, numerators, denominators = NULL,
                         df, part = NULL) {
  variants <- lapply(c(FALSE, TRUE), function(screened) {
    d <- run_qic(screened, df, part)
    stopifnot(nrow(d) == length(keys))
    stopifnot(all.equal(d$y, if (is.null(denominators)) numerators else numerators / denominators))
    list(
      outliers_in_limits = !screened,
      cl                 = d$cl,
      lcl                = d$lcl,
      ucl                = d$ucl,
      sigma_signal       = d$sigma.signal,
      runs_signal        = d$runs.signal,
      part               = d$part
    )
  })
  list(
    name         = name,
    description  = description,
    keys         = keys,
    numerators   = numerators,
    denominators = denominators,
    variants     = variants
  )
}

fixtures <- list()

# ---- 1. Kontinuert serie uden nævner (d_i = 1), med negative værdier ----
# Ingen automatisk afskæring ved 0: LCL skal kunne blive negativ.
cont_y <- c(2.3, -0.4, 1.7, 3.1, 0.2, -1.5, 2.8, 1.1, 0.6, 2.2,
            -0.8, 1.9, 3.4, 0.9, -0.2, 1.4, 2.6, 0.1, 1.8, -1.1)
fixtures$continuous_no_denominator <- make_fixture(
  "continuous_no_denominator",
  "Kontinuerte målinger uden nævner; reduceres til I-kort med eksakt sqrt(pi/2)",
  keys = as.character(seq_along(cont_y)),
  numerators = cont_y,
  df = data.frame(x = seq_along(cont_y), y = cont_y)
)

# ---- 2. Aggregerede gennemsnit med varierende gruppestørrelse ----
# qic() fodres med råobservationer og gentaget x; den aggregerer selv til
# y = mean og n = antal. Visualen får tæller = sum, nævner = antal — dvs.
# præcis "tæller = gennemsnit × n", som README anviser.
set.seed(20260916)
grp_sizes <- c(3, 7, 2, 5, 9, 4, 6, 2, 8, 5, 3, 7)
grp_id    <- rep(seq_along(grp_sizes), grp_sizes)
raw_obs   <- round(12 + rnorm(length(grp_id), sd = 2), 2)
grp_sum   <- as.numeric(tapply(raw_obs, grp_id, sum))
grp_n     <- as.numeric(tapply(raw_obs, grp_id, length))
stopifnot(all(grp_n == grp_sizes))
fixtures$aggregated_means <- make_fixture(
  "aggregated_means",
  "Gruppegennemsnit med varierende n; tæller = gruppesum, nævner = gruppestørrelse",
  keys = as.character(seq_along(grp_sizes)),
  numerators = grp_sum,
  denominators = grp_n,
  df = data.frame(x = grp_id, y = raw_obs)
)

# ---- 3. Proportion/rate med varierende nævner ----
prop_num <- c(5, 7, 5, 7, 7, 5, 4, 9, 8, 13, 8, 7, 8, 7, 12, 11, 8)
prop_den <- c(113, 132, 121, 134, 116, 131, 93, 138, 182, 157, 100, 103, 146, 108, 153, 141, 134)
fixtures$proportion_varying_denominator <- make_fixture(
  "proportion_varying_denominator",
  "Andel med varierende nævner; grænsebredde ∝ 1/sqrt(d_i)",
  keys = as.character(seq_along(prop_num)),
  numerators = prop_num,
  denominators = prop_den,
  df = data.frame(x = seq_along(prop_num), y = prop_num, n = prop_den)
)

# ---- 4. Én ekstrem successive difference: screening skal gøre en forskel ----
ext_y <- c(10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 40, 11, 10, 12, 11, 10)
fixtures$extreme_difference <- make_fixture(
  "extreme_difference",
  "Ét spring giver to store s_i; screening (outliers_in_limits=false) giver smallere grænser",
  keys = as.character(seq_along(ext_y)),
  numerators = ext_y,
  df = data.frame(x = seq_along(ext_y), y = ext_y)
)

# ---- 5. To faser (part) med varierende nævner ----
ph_num <- c(12, 15, 11, 14, 13, 16, 12, 14, 22, 25, 21, 24, 23, 26, 22, 24)
ph_den <- c(4, 6, 3, 5, 4, 7, 3, 5, 6, 8, 5, 7, 6, 9, 5, 7)
fixtures$two_phases <- make_fixture(
  "two_phases",
  "Faseskift efter punkt 8; hver fase har egen CL og eget s-bar",
  keys = as.character(seq_along(ph_num)),
  numerators = ph_num,
  denominators = ph_den,
  df = data.frame(x = seq_along(ph_num), y = ph_num, n = ph_den),
  part = 8
)

# Kontrol: screening skal faktisk ændre noget i fixture 4 og ingenting i 1.
stopifnot(!isTRUE(all.equal(fixtures$extreme_difference$variants[[1]]$ucl,
                            fixtures$extreme_difference$variants[[2]]$ucl)))
stopifnot(any(fixtures$extreme_difference$variants[[2]]$sigma_signal))
stopifnot(all(sapply(fixtures, function(f) all(is.finite(c(f$variants[[1]]$lcl, f$variants[[2]]$ucl))))))

out <- list(
  generated_by = "test/Chart Types/ip-fixtures-gen.R",
  qicharts2_version = as.character(packageVersion("qicharts2")),
  fixtures = unname(fixtures)
)
write_json(out, "test/Chart Types/ip-fixtures.json", digits = NA, pretty = TRUE, auto_unbox = TRUE, null = "null")
cat("Skrev", length(fixtures), "fixtures til test/Chart Types/ip-fixtures.json\n")
