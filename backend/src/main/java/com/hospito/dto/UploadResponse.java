package com.hospito.dto;

public record UploadResponse(
        String fileName,
        String filePath,
        String fileUrl
) {
}
