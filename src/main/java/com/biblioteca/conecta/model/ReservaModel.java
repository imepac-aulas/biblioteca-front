package com.biblioteca.conecta.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Getter
@Setter
public class ReservaModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idReserva;

    private Long idUsuario;
    private Long idItemAcervo;
    private LocalDate dataReserva;
    private String status; // Ex: "Aguardando Devolução", "Finalizada"
}