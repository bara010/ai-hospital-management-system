package com.hospito.repository;

import com.hospito.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            select m from ChatMessage m
            where (m.sender.id = :userA and m.recipient.id = :userB)
               or (m.sender.id = :userB and m.recipient.id = :userA)
            order by m.createdAt asc
            """)
    List<ChatMessage> findConversation(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("""
            select m from ChatMessage m
            where m.sender.id = :userId or m.recipient.id = :userId
            order by m.createdAt desc
            """)
    List<ChatMessage> findRecentForUser(@Param("userId") Long userId);
}
