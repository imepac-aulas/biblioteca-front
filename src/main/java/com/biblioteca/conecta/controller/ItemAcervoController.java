package com.biblioteca.conecta.controller;

import com.biblioteca.conecta.model.ItemAcervoModel;
import com.biblioteca.conecta.service.ItemAcervoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/acervo")
public class ItemAcervoController {

    @Autowired
    private ItemAcervoService itemAcervoService;

    // GET /api/acervo -> Lista todos os itens
    // GET /api/acervo?q=texto -> Busca itens por 'texto'
    @GetMapping
    public List<ItemAcervoModel> listarItens(@RequestParam(required = false, name = "q") String termoBusca) {
        return itemAcervoService.listarTodos(termoBusca);
    }

    // GET /api/acervo/1 -> Busca o item com ID 1
    @GetMapping("/{id}")
    public ResponseEntity<ItemAcervoModel> buscarItemPorId(@PathVariable Long id) {
        return itemAcervoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/acervo -> Cria um novo item
    @PostMapping
    public ResponseEntity<ItemAcervoModel> criarItem(@RequestBody ItemAcervoModel item) {
        ItemAcervoModel novoItem = itemAcervoService.salvar(item);
        return new ResponseEntity<>(novoItem, HttpStatus.CREATED);
    }

    // PUT /api/acervo/1 -> Atualiza o item com ID 1
    @PutMapping("/{id}")
    public ResponseEntity<ItemAcervoModel> atualizarItem(@PathVariable Long id, @RequestBody ItemAcervoModel itemDetalhes) {
        return itemAcervoService.atualizar(id, itemDetalhes)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/acervo/1 -> Deleta o item com ID 1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarItem(@PathVariable Long id) {
        if (itemAcervoService.deletar(id)) {
            return ResponseEntity.noContent().build(); // Sucesso, sem conteúdo para retornar
        } else {
            return ResponseEntity.notFound().build(); // Item não encontrado
        }
    }
}