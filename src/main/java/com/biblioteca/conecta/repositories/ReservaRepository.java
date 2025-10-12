package com.biblioteca.conecta.repositories;

import com.biblioteca.conecta.model.ReservaModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaRepository extends JpaRepository<ReservaModel, Long> {
}