// Pacote: com.biblioteca.conecta.controller
package com.biblioteca.conecta.controller;

import com.biblioteca.conecta.model.UsuarioModel;
import com.biblioteca.conecta.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Define que esta classe é um controller de API REST
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping // Mapeia para requisições GET em /api/usuarios
    public List<UsuarioModel> listarTodosUsuarios() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/{id}") // Mapeia para GET em /api/usuarios/1 (por exemplo)
    public ResponseEntity<UsuarioModel> buscarUsuarioPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id)
                .map(usuario -> ResponseEntity.ok(usuario)) // Se encontrar, retorna 200 OK
                .orElse(ResponseEntity.notFound().build()); // Se não, retorna 404 Not Found
    }

    @PostMapping // Mapeia para requisições POST em /api/usuarios
    @ResponseStatus(HttpStatus.CREATED) // Retorna o status 201 Created
    public UsuarioModel criarUsuario(@RequestBody UsuarioModel usuario) {
        return usuarioService.salvar(usuario);
    }

    @PutMapping("/{id}") // Mapeia para PUT em /api/usuarios/1
    public ResponseEntity<UsuarioModel> atualizarUsuario(@PathVariable Long id, @RequestBody UsuarioModel usuarioDetalhes) {
        return usuarioService.buscarPorId(id)
                .map(usuario -> {
                    usuario.setNome(usuarioDetalhes.getNome());
                    usuario.setEmail(usuarioDetalhes.getEmail());
                    usuario.setSenha(usuarioDetalhes.getSenha());
                    UsuarioModel atualizado = usuarioService.salvar(usuario);
                    return ResponseEntity.ok(atualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}") // Mapeia para DELETE em /api/usuarios/1
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {
        if (usuarioService.buscarPorId(id).isPresent()) {
            usuarioService.deletar(id);
            return ResponseEntity.noContent().build(); // Retorna 204 No Content
        } else {
            return ResponseEntity.notFound().build(); // Retorna 404 Not Found
        }
    }
}