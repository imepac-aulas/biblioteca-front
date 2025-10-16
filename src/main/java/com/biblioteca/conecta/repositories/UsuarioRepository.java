// Pacote: com.biblioteca.conecta.repositories
package com.biblioteca.conecta.repositories;

import com.biblioteca.conecta.model.UsuarioModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioModel, Long> {

}