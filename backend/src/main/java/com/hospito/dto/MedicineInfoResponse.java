package com.hospito.dto;

import java.util.List;

public record MedicineInfoResponse(
        String query,
        String genericName,
        List<String> brandNames,
        List<String> uses,
        List<String> dosageAndAdministration,
        List<String> sideEffects,
        List<String> warnings,
        String source
) {
}
