package com.biblioteca.conecta.service;

import com.biblioteca.conecta.model.ItemAcervoModel;
import com.biblioteca.conecta.repositories.ItemAcervoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class ItemAcervoService {

    @Autowired
    private ItemAcervoRepository itemAcervoRepository;

    public List<ItemAcervoModel> listarTodos(String termoBusca) {
        // A mágica da busca acontece aqui!
        if (StringUtils.hasText(termoBusca)) {
            return itemAcervoRepository.findByTituloContainingIgnoreCaseOrAutorContainingIgnoreCase(termoBusca, termoBusca);
        } else {
            // Se não, retorna todos os itens
            return itemAcervoRepository.findAll();
        }
    }

    public Optional<ItemAcervoModel> buscarPorId(Long id) {
        return itemAcervoRepository.findById(id);
    }

    public ItemAcervoModel salvar(ItemAcervoModel item) {
        return itemAcervoRepository.save(item);
    }

    public Optional<ItemAcervoModel> atualizar(Long id, ItemAcervoModel itemDetalhes) {
        return itemAcervoRepository.findById(id)
                .map(itemExistente -> {
                    itemExistente.setTitulo(itemDetalhes.getTitulo());
                    itemExistente.setAutor(itemDetalhes.getAutor());
                    itemExistente.setTipo(itemDetalhes.getTipo());
                    itemExistente.setCategoria(itemDetalhes.getCategoria());
                    return itemAcervoRepository.save(itemExistente);
                });
    }

    public boolean deletar(Long id) {
        if (itemAcervoRepository.existsById(id)) {
            itemAcervoRepository.deleteById(id);
            return true;
        }
        return false;
    }
}