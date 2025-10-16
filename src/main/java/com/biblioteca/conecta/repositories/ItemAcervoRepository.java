package com.biblioteca.conecta.repositories;

import com.biblioteca.conecta.model.ItemAcervoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemAcervoRepository extends JpaRepository<ItemAcervoModel, Long> {

    /**
     * Busca itens no acervo cujo título OU autor contenham o termo de busca.
     * A busca ignora se as letras são maiúsculas ou minúsculas.
     * Ex: buscar por "hobbit" encontrará "O Hobbit".
     */
    List<ItemAcervoModel> findByTituloContainingIgnoreCaseOrAutorContainingIgnoreCase(String titulo, String autor);

}