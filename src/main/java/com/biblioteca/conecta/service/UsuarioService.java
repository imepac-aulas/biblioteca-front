// Pacote: com.biblioteca.conecta.service
package com.biblioteca.conecta.service;

import com.biblioteca.conecta.model.UsuarioModel;
import com.biblioteca.conecta.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service // Marca a classe como um serviço do Spring, onde a lógica de negócio reside
public class UsuarioService {

    @Autowired // Injeção de dependência: o Spring vai instanciar o repository pra gente
    private UsuarioRepository usuarioRepository;

    public List<UsuarioModel> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Optional<UsuarioModel> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public UsuarioModel salvar(UsuarioModel usuario) {
        // Aqui você poderia adicionar lógicas, como validar se o email já existe, etc.
        return usuarioRepository.save(usuario);
    }

    public void deletar(Long id) {
        usuarioRepository.deleteById(id);
    }
}