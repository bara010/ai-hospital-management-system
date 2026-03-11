package com.hospito.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospito.dto.MedicineInfoResponse;
import com.hospito.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class MedicineInfoService {

    private static final String OPEN_FDA_URL = "https://api.fda.gov/drug/label.json";
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^A-Za-z0-9]+");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    private final ObjectMapper objectMapper;

    public MedicineInfoService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public MedicineInfoResponse lookup(String medicineName) {
        String query = medicineName == null ? "" : medicineName.trim();
        if (query.isBlank()) {
            throw new BadRequestException("Medicine name is required");
        }

        for (String searchQuery : buildSearchQueries(query)) {
            JsonNode labelNode = fetchFirstLabel(searchQuery);
            if (labelNode == null) {
                continue;
            }

            MedicineInfoResponse response = toResponse(query, labelNode);
            if (response != null) {
                return response;
            }
        }

        throw new BadRequestException(
                "No verified medicine details found for \"" + query + "\". Try exact brand or generic name."
        );
    }

    private List<String> buildSearchQueries(String query) {
        Set<String> queries = new LinkedHashSet<>();
        String escaped = escapeQueryTerm(query);

        queries.add("(openfda.brand_name.exact:\"" + escaped + "\" OR openfda.generic_name.exact:\"" + escaped + "\")");
        queries.add("(openfda.brand_name:\"" + escaped + "\" OR openfda.generic_name:\"" + escaped + "\")");
        queries.add("openfda.substance_name:\"" + escaped + "\"");

        List<String> tokens = tokenize(query);
        if (!tokens.isEmpty()) {
            String wildcardAnd = String.join(" AND ", tokens.stream().map(token -> token + "*").toList());
            String wildcardOr = String.join(" OR ", tokens.stream().map(token -> token + "*").toList());
            queries.add("(openfda.brand_name:(" + wildcardAnd + ") OR openfda.generic_name:(" + wildcardAnd + "))");
            queries.add("(openfda.brand_name:(" + wildcardOr + ") OR openfda.generic_name:(" + wildcardOr + "))");
        }

        return new ArrayList<>(queries);
    }

    private JsonNode fetchFirstLabel(String searchQuery) {
        try {
            String encodedQ = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            URI uri = URI.create(OPEN_FDA_URL + "?search=" + encodedQ + "&limit=1");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status == 404) {
                return null;
            }
            if (status == 429) {
                throw new BadRequestException("Medicine information service is busy. Please retry in a minute.");
            }
            if (status < 200 || status >= 300) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                return null;
            }

            return results.get(0);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ignored) {
            return null;
        }
    }

    private MedicineInfoResponse toResponse(String query, JsonNode node) {
        JsonNode openFda = node.path("openfda");

        String genericName = firstText(openFda.path("generic_name"), query);
        List<String> brandNames = unique(asList(openFda.path("brand_name"), 8));

        List<String> uses = unique(merged(node, List.of("indications_and_usage", "purpose"), 5));
        List<String> dosage = unique(asList(node.path("dosage_and_administration"), 5));
        List<String> sideEffects = unique(asList(node.path("adverse_reactions"), 5));
        List<String> warnings = unique(merged(node, List.of("warnings", "boxed_warning", "warnings_and_precautions"), 6));

        if (uses.isEmpty() && dosage.isEmpty() && sideEffects.isEmpty() && warnings.isEmpty()) {
            return null;
        }

        return new MedicineInfoResponse(
                query,
                genericName,
                brandNames,
                uses,
                dosage,
                sideEffects,
                warnings,
                "openFDA"
        );
    }

    private List<String> tokenize(String value) {
        List<String> tokens = new ArrayList<>();
        for (String token : TOKEN_SPLIT.split(value.toLowerCase(Locale.ROOT))) {
            String clean = token.trim();
            if (!clean.isEmpty()) {
                tokens.add(clean);
            }
        }
        return tokens;
    }

    private String escapeQueryTerm(String value) {
        return value
                .trim()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }

    private String firstText(JsonNode node, String fallback) {
        if (!node.isArray() || node.isEmpty()) {
            return fallback;
        }
        String value = sanitize(node.get(0).asText(""));
        return value.isEmpty() ? fallback : value;
    }

    private List<String> merged(JsonNode node, List<String> fields, int max) {
        List<String> values = new ArrayList<>();
        for (String field : fields) {
            values.addAll(asList(node.path(field), max));
            if (values.size() >= max) {
                break;
            }
        }

        if (values.size() > max) {
            return values.subList(0, max);
        }
        return values;
    }

    private List<String> asList(JsonNode node, int max) {
        List<String> values = new ArrayList<>();
        if (node == null || node.isMissingNode() || node.isNull()) {
            return values;
        }

        if (node.isArray()) {
            for (JsonNode item : node) {
                String text = sanitize(item.asText(""));
                if (!text.isEmpty()) {
                    values.add(text);
                }
                if (values.size() >= max) {
                    break;
                }
            }
            return values;
        }

        String text = sanitize(node.asText(""));
        if (!text.isEmpty()) {
            values.add(text);
        }
        return values;
    }

    private List<String> unique(List<String> values) {
        Set<String> set = new LinkedHashSet<>();
        for (String value : values) {
            String clean = sanitize(value);
            if (!clean.isEmpty()) {
                set.add(clean);
            }
        }
        return new ArrayList<>(set);
    }

    private String sanitize(String value) {
        if (value == null) {
            return "";
        }

        String clean = value.replaceAll("\\s+", " ").trim();
        if (clean.length() > 280) {
            return clean.substring(0, 277) + "...";
        }
        return clean;
    }
}
