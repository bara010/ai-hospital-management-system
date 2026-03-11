package com.hospito.service;

import com.hospito.dto.UploadResponse;
import com.hospito.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootPath;

    public FileStorageService(@Value("${hospito.upload.dir}") String uploadDir) {
        this.rootPath = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to initialize upload directory", ex);
        }
    }

    public UploadResponse store(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = "";
        int idx = original.lastIndexOf('.');
        if (idx > 0) {
            extension = original.substring(idx);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path folderPath = rootPath.resolve(folder).normalize();
        Path targetPath = folderPath.resolve(storedFileName);

        if (!targetPath.startsWith(rootPath)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(folderPath);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store file", ex);
        }

        String relativePath = folder + "/" + storedFileName;
        return new UploadResponse(storedFileName, relativePath, "/uploads/" + relativePath);
    }
}
