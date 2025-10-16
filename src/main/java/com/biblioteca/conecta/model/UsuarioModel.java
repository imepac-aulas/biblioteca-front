// Pacote: com.biblioteca..model
package com.biblioteca.conecta.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // Avisa ao JPA que esta classe é uma entidade do banco de dados
@Table(name = "usuarios") // Define o nome da tabela no banco
@Getter // Lombok: cria os getters para todos os atributos
@Setter // Lombok: cria os setters para todos os atributos
@NoArgsConstructor // Lombok: cria um construtor vazio (obrigatório pelo JPA)
@AllArgsConstructor // Lombok: cria um construtor com todos os atributos
public class UsuarioModel {

    @Id // Marca o atributo como a chave primária da tabela
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Define que o ID será gerado e gerenciado pelo banco (auto-incremento)
    private Long id;

    private String nome;
    private String email;
    private String senha; // Em um projeto real, sempre armazene a senha criptografada!

}