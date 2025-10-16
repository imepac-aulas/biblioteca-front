package com.biblioteca.conecta.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ItemAcervoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;      // "Livro", "Revista", etc.
    private String titulo;
    private String autor;     // Ou "Fabricante", "Editora"
    private String categoria; // "Ficção", "Tecnologia", etc.
}